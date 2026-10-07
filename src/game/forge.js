import { Forge } from "../web3/contracts/contract_forge";
import { read, write } from "./storage";
import { nowSec } from "./clock";

// The whole game loop runs on the player's device. Progress is kept in localStorage and goes
// on-chain with the player's own transactions (list, save, send). The contract caps what any
// upload can claim, so the device is trusted with the rest.
//
// Storage keys (scoped to the contract, so a redeploy starts clean)
//   forge:<contract>:sword:<tokenId>   { tokenId, owner, base, value, furnaceSeconds, earnedPoints, strikes, totalScore, furnace, lastStrike }
//   forge:<contract>:stats:<address>   { count, totalScore, valueAdded, perfect, clean, rough, glancing, recent }

const E = 10n ** 18n;
/* =====================================================================
 * GAME SETTINGS — tune the strike minigames here.
 *
 * Every strike rolls one minigame from `games` and one of the four levels. Both are fixed by
 * the weapon and its strike count, so reopening a strike gives the same roll. Scores are 0-100
 * in every game and level, so harder rolls only make a good score harder to reach.
 * ===================================================================== */
const MINIGAME = {
    // Minigames a strike can roll, equally likely. Remove one to turn it off.
    games: [ "ring", "burn", "rune" ],

    // The four levels, equally likely
    //   ringMs     hammer ring: how long a ring takes to close
    //   heatSec    flame burn: seconds of flame to take the weapon from cold to black
    //   runeSec    rune memory: seconds for all 12 runes to appear
    levels: {
        easy:   { ringMs: 1550, heatSec: 1.7, runeSec: 5.5 },
        normal: { ringMs: 1100, heatSec: 1.2, runeSec: 4.0 },
        hard:   { ringMs: 850,  heatSec: 0.8, runeSec: 2.5 },
        insane: { ringMs: 650,  heatSec: 0.5, runeSec: 1.5 },
    },

    // Hammer ring: tap when the ring lands on the glowing target
    ring: {
        blows:      10,     // targets per strike
        spawnEvery: 0.5,    // a new target appears every this share of a ring's close time
        biggestPx:  88,     // largest target circle
        smallestPx: 40,     // smallest target circle
        // How far off a tap may be and still score 100, as a share of the ring size:
        // easyTolerance for the biggest target, hardTolerance for the smallest
        easyTolerance: 0.18,
        hardTolerance: 0.05,
        falloff:    0.65,   // how fast the score drops outside that window
        hardness:   3,      // divides both windows: 1 = gentle, 3 = three times harder
    },

    // Flame burn: hold to blow fire on the weapon, let go when it reaches the target heat
    burn: {
        blows:      5,      // holds per strike
        minHoldSec: 0.1,    // shortest target hold
        maxHoldSec: 2.0,    // longest target hold (capped below the level's heatSec)
        perfectSec: 0.03,   // let go this close to the target for 100
        falloffSec: 0.3,    // score reaches 0 this far past the perfect window
        hardness:   3,      // divides both windows: 1 = gentle, 3 = three times harder
    },

    // Rune memory: 12 runes appear around the weapon, red or green, then all turn blue.
    // Tap every rune that was the color asked for, before time runs out.
    rune: {
        rounds:     3,      // rounds per strike
        answerSec:  6.0,    // time to tap
        minTarget:  2,      // runes of the asked color per round, at least...
        maxTarget:  10,     // ...and at most
    },
};

const LEVEL_IDS = [ "easy", "normal", "hard", "insane" ];
/* ===================================================================== */

// Furnace speed and the point cap come from the contract (furnaceRate);
// the owner sets them with setPointsPerHour and setMaxPoints
let POINTS_PER_HOUR = 3;
let MAX_POINTS = 1000;
const FURNACE_CAP = 24 * 60 * 60;       // one charge counts up to 24h
let STRIKES_PER_MONTH = 2160;

/** Called after each chain read so the engine uses the contract's current furnace speed */
const setFurnaceRate = (pointsPerHour, maxPoints) => {
    const pph = Number(pointsPerHour) || 3;
    POINTS_PER_HOUR = pph;
    STRIKES_PER_MONTH = pph * 720;
    MAX_POINTS = Number(maxPoints) || 1000;
};
const VALUE_CAP_COINS = 5000;
const BPS = 10000n;
const MAX_RATE_BPS = 1400n;
const RECENT_STRIKES = 20;
const CLOCK_MARGIN = 90;                // seconds of slack for a phone clock running ahead of the chain


const scope = String(Forge.address).toLowerCase();
const swordKey = (tokenId) => `forge:${scope}:sword:${tokenId}`;
const statsKey = (account) => `forge:${scope}:stats:${String(account).toLowerCase()}`;
const lower = (a) => String(a ?? "").toLowerCase();

const fail = (message) => {
    throw new Error(message);
};

/* ----------------------------------------------------------- formula */

/** Monthly rate: 4% time + up to 4% from value (0-5000) + up to 6% from the strike score */
const rateOf = (valueWei, score) => {
    const coins = Number(BigInt(valueWei) / 10n ** 14n) / 1e4;
    return 0.04 + 0.04 * Math.min(coins, VALUE_CAP_COINS) / VALUE_CAP_COINS + 0.06 * Math.max(0, Math.min(100, score)) / 100;
};

/** Value added by one strike, compounding so 8640 strikes land exactly on the monthly rate */
const strikeIncrease = (valueWei, score) => {
    const factor = Math.pow(1 + rateOf(valueWei, score), 1 / STRIKES_PER_MONTH) - 1;
    return BigInt(valueWei) * BigInt(Math.floor(factor * 1e18)) / E;
};

/** Same integer math as ForgeEngine.maxValue, so an upload never trips the cap */
const maxValue = (value, strikes) => {
    let v = BigInt(value);
    const months = BigInt(strikes) / BigInt(STRIKES_PER_MONTH);
    for (let i = 0n; i < months; i++) v = v * (BPS + MAX_RATE_BPS) / BPS;
    const rest = BigInt(strikes) % BigInt(STRIKES_PER_MONTH);
    return v + v * MAX_RATE_BPS * rest / (BPS * BigInt(STRIKES_PER_MONTH));
};

/** Points earned from heat; older records without the field fall back to 1 point per 5 minutes */
const earnedOf = (sword) => Number(sword?.earnedPoints ?? Math.floor(Number(sword?.furnaceSeconds ?? 0) / 300));

/** Unspent points, never above the per-weapon cap */
const pointsOf = (sword) => Math.max(0, Math.min(MAX_POINTS, earnedOf(sword) - Number(sword?.strikes ?? 0)));

/* ------------------------------------------------------------ swords */

/** Starts a record from what the chain says; used for new swords and anything out of date */
const fromChain = (tokenId, owner, chain, previous) => ({
    tokenId: String(tokenId),
    owner: lower(owner),
    // The on-chain snapshot this progress builds on; when the chain moves on, so does the record
    base: { syncedAt: String(chain?.syncedAt ?? 0), value: String(chain?.value ?? 0), strikes: Number(chain?.strikes ?? 0), furnaceMinutes: Number(chain?.furnaceMinutes ?? 0), totalScore: Number(chain?.totalScore ?? 0) },
    value: String(chain?.value ?? 0),
    furnaceSeconds: Number(chain?.furnaceMinutes ?? 0) * 60,
    earnedPoints: Number(chain?.points ?? 0) + Number(chain?.strikes ?? 0),
    strikes: Number(chain?.strikes ?? 0),
    totalScore: Number(chain?.totalScore ?? 0),
    furnace: null,
    // Keeps difficulty alternating across a save, as long as the owner is the same
    lastStrike: lower(previous?.owner) === lower(owner) ? previous?.lastStrike ?? null : null,
});

/**
 * Local progress if it still sits on top of the current on-chain snapshot, otherwise a fresh
 * record from the chain (after a sale, a transfer, a save from another phone, or a first visit).
 */
function swordOf(tokenId, owner, chain) {
    const saved = read(swordKey(tokenId));
    const isCurrent = saved
        && lower(saved.owner) === lower(owner)
        && String(saved.base?.syncedAt) === String(chain?.syncedAt ?? 0)
        && Number(saved.strikes) >= Number(chain?.strikes ?? 0);
    if (isCurrent) return saved;

    const fresh = fromChain(tokenId, owner, chain, saved);
    write(swordKey(tokenId), fresh);
    return fresh;
}

const save = (sword) => write(swordKey(sword.tokenId), sword);

/** Banks heat up to the 24h cap and empties the furnace */
const coolDown = (sword) => {
    const heated = Math.max(0, Math.min(nowSec() - Number(sword.furnace?.startedAt ?? nowSec()), FURNACE_CAP));
    sword.furnaceSeconds += heated;
    // Heat past the cap is wasted: a weapon holds at most MAX_POINTS unspent points
    const earned = earnedOf(sword) + Math.floor(heated * POINTS_PER_HOUR / 3600);
    sword.earnedPoints = Math.min(earned, Number(sword.strikes ?? 0) + MAX_POINTS);
    sword.furnace = null;
    return heated;
};

/** Progress not on-chain yet; only this phone has it until the next list, save or send */
const unsavedOf = (sword) => ({
    strikes: Math.max(0, sword.strikes - Number(sword.base?.strikes ?? 0)),
    minutes: Math.max(0, Math.floor(sword.furnaceSeconds / 60) - Number(sword.base?.furnaceMinutes ?? 0)),
});

/**
 * When the progress on this phone started piling up: the last on-chain save.
 * null when there is nothing unsaved.
 */
const unsavedSinceOf = (sword) => {
    const u = unsavedOf(sword);
    return u.strikes > 0 || u.minutes > 0 ? Number(sword.base?.syncedAt ?? 0) : null;
};

const viewOf = (sword) => ({
    tokenId: sword.tokenId,
    value: sword.value,
    points: pointsOf(sword),
    // Holding the most points a weapon can bank: more heat is wasted until some are spent
    isFull: pointsOf(sword) >= MAX_POINTS,
    furnaceSeconds: sword.furnaceSeconds,
    earnedPoints: earnedOf(sword),
    strikes: sword.strikes,
    totalScore: sword.totalScore,
    isInFurnace: Boolean(sword.furnace),
    lastStrike: sword.lastStrike,
    unsaved: unsavedOf(sword),
    unsavedSince: unsavedSinceOf(sword),
});

/* ------------------------------------------------------------- state */

/**
 * Everything the armory needs, built from the chain plus this device's storage.
 * @param {string} account
 * @param {string[]} ids        owned token ids (getUserInfo)
 * @param {object[]} chainSwords matching on-chain swords
 * @param {number} slots        furnace slots (getAccount().furnaces)
 */
function buildState(account, ids, chainSwords, slots) {
    const swords = {};
    const items = Array(Math.max(1, Number(slots) || 3)).fill(null);

    ids.forEach((id, i) => {
        const sword = swordOf(id, account, chainSwords[i]);
        const isListed = BigInt(chainSwords[i]?.listPrice ?? 0) > 0n;
        const slot = Number(sword.furnace?.slot);

        // A listed sword cannot heat; a clash or a lost slot just banks the heat
        if (sword.furnace && (isListed || !(slot < items.length) || items[slot])) {
            coolDown(sword);
            save(sword);
        }
        if (sword.furnace) items[slot] = { tokenId: sword.tokenId, startedAt: sword.furnace.startedAt, endsAt: sword.furnace.startedAt + FURNACE_CAP };
        swords[String(id)] = viewOf(sword);
    });

    return {
        now: nowSec(),
        swords,
        furnaces: { slots: items.length, items },
        rules: { pointsPerHour: POINTS_PER_HOUR, maxPoints: MAX_POINTS, furnaceCap: FURNACE_CAP, strikesPerMonth: STRIKES_PER_MONTH },
    };
}

/* ---------------------------------------------------------- furnaces */

function startFurnace(account, tokenId, chain, furnaces) {
    if (BigInt(chain?.listPrice ?? 0) > 0n) fail("Cancel the listing before heating this weapon.");
    const slot = (furnaces?.items ?? []).findIndex((item) => !item);
    if (slot < 0) fail(`All ${furnaces?.slots ?? 3} furnaces are busy. Take a weapon out first.`);

    const sword = swordOf(tokenId, account, chain);
    if (sword.furnace) fail("This weapon is already in a furnace.");
    sword.furnace = { slot, startedAt: nowSec() };
    save(sword);
}

function stopFurnace(account, tokenId, chain) {
    const sword = swordOf(tokenId, account, chain);
    if (!sword.furnace) fail("That weapon is not in a furnace.");
    const before = pointsOf(sword);
    const heated = coolDown(sword);
    save(sword);
    return { heated, earned: pointsOf(sword) - before, points: pointsOf(sword) };
}

/* ------------------------------------------------------------ strike */

/** Small stable hash, so a strike's game and difficulty do not change by reopening it */
const hash = (text) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return h >>> 0;
};

/**
 * Turns three random numbers (0-1) into a roll: the minigame, the level, a little speed jitter
 * inside the level, and a seed the minigame uses for its targets.
 */
const makeRoll = (gamePick, levelPick, jitter, seed) => {
    const games = MINIGAME.games.length ? MINIGAME.games : [ "ring" ];
    const game = games[Math.min(games.length - 1, Math.floor(gamePick * games.length))];
    const difficulty = LEVEL_IDS[Math.min(3, Math.floor(levelPick * 4))];
    const level = MINIGAME.levels[difficulty];
    const wobble = 0.92 + jitter * 0.16;            // +-8% inside the level
    return {
        game,
        difficulty,
        seed,
        closeMs: Math.round(level.ringMs * wobble),
        heatSec: +(level.heatSec * wobble).toFixed(2),
        runeSec: level.runeSec,
        ring: MINIGAME.ring,
        burn: MINIGAME.burn,
        rune: MINIGAME.rune,
    };
};

/** The strike's roll, fixed by a hash of the weapon and strike count so reopening gives the same one */
const rollFor = (sword) => {
    const h = hash(`${scope}:${sword.tokenId}:${sword.strikes}`);
    return makeRoll((h % 997) / 997, ((h >>> 10) % 991) / 991, ((h >>> 20) % 101) / 100, h >>> 1);
};

function startStrike(account, tokenId, chain) {
    if (BigInt(chain?.listPrice ?? 0) > 0n) fail("Cancel the listing before striking.");
    const sword = swordOf(tokenId, account, chain);
    if (sword.furnace) fail("Take the weapon out of the furnace before striking.");
    if (pointsOf(sword) < 1) fail("No strike points left. Heat the weapon in a furnace first.");
    return { tokenId: sword.tokenId, strikesAtStart: sword.strikes, startedAt: Date.now(), ...rollFor(sword) };
}

const bucketOf = (score) => (score >= 95 ? "perfect" : score >= 75 ? "clean" : score >= 40 ? "rough" : "glancing");

const getStats = (account) => read(statsKey(account), null) ?? { count: 0, totalScore: 0, valueAdded: "0", perfect: 0, clean: 0, rough: 0, glancing: 0, recent: [] };

/**
 * A practice round: same minigame and settings as a real strike, but nothing is spent or saved.
 * Random every time, and shown on a random weapon from the catalog.
 */
function practiceRoll() {
    return {
        ...makeRoll(Math.random(), Math.random(), Math.random(), Math.floor(Math.random() * 2 ** 31)),
        isPractice: true,
        weaponSeed: String(Math.floor(Math.random() * 1e9)),
    };
}

function finishStrike(account, session, score, chain) {
    const sword = swordOf(session.tokenId, account, chain);
    // A strike only counts once, and only on the progress it started from
    if (sword.strikes !== Number(session.strikesAtStart)) fail("This strike has expired. Start a new one.");
    if (pointsOf(sword) < 1) fail("No strike points left. Heat the weapon in a furnace first.");

    const quality = Math.round(Math.max(0, Math.min(100, Number(score) || 0)));
    const increase = strikeIncrease(sword.value, quality);
    sword.value = (BigInt(sword.value) + increase).toString();
    sword.strikes += 1;
    sword.totalScore += quality;
    sword.lastStrike = { score: quality, increase: increase.toString(), game: session.game, difficulty: session.difficulty, at: nowSec() };
    save(sword);

    const stats = getStats(account);
    stats.count += 1;
    stats.totalScore += quality;
    stats.valueAdded = (BigInt(stats.valueAdded) + increase).toString();
    stats[bucketOf(quality)] += 1;
    stats.recent = [ { tokenId: sword.tokenId, game: session.game, difficulty: session.difficulty, score: quality, increase: increase.toString(), at: nowSec() }, ...(stats.recent ?? []) ].slice(0, RECENT_STRIKES);
    write(statsKey(account), stats);

    return { tokenId: sword.tokenId, score: quality, increase: increase.toString(), value: sword.value, points: pointsOf(sword) };
}

/* ---------------------------------------------------------- on-chain */

/**
 * The Stats struct for list / sync / transferWithStats, trimmed to what the contract will accept
 * right now, so a slightly fast phone clock costs a few minutes of heat instead of a failed transaction.
 */
function statsForChain(account, tokenId, chain) {
    const sword = swordOf(tokenId, account, chain);
    if (sword.furnace) fail("Take the weapon out of the furnace first.");

    const baseMinutes = Number(chain?.furnaceMinutes ?? 0);
    const sinceSave = Math.max(0, nowSec() - CLOCK_MARGIN - Number(chain?.syncedAt ?? 0));
    const furnaceMinutes = Math.min(Math.floor(sword.furnaceSeconds / 60), baseMinutes + Math.floor(sinceSave / 60));

    // Same rule as the contract: points earned since the last save fit in the heat added since then
    const earnedBefore = Number(chain?.points ?? 0) + Number(chain?.strikes ?? 0);
    const allowed = earnedBefore + Math.floor((furnaceMinutes - baseMinutes) * POINTS_PER_HOUR / 60);
    const earned = Math.min(earnedOf(sword), allowed, sword.strikes + MAX_POINTS);
    const points = earned - sword.strikes;
    if (points < 0) fail("Your phone's clock looks ahead of the chain. Try again in a few minutes.");

    const cap = maxValue(chain?.value ?? 0, sword.strikes - Number(chain?.strikes ?? 0));
    const value = BigInt(sword.value) > cap ? cap : BigInt(sword.value);

    return {
        value: value.toString(),
        points: String(points),
        furnaceMinutes: String(furnaceMinutes),
        strikes: String(sword.strikes),
        totalScore: String(sword.totalScore),
    };
}

export {
    buildState, startFurnace, stopFurnace, setFurnaceRate,
    startStrike, finishStrike, practiceRoll, getStats, statsForChain,
    strikeIncrease, maxValue,
};
