// Vercel Function: POST /api/sign
//
// Signs weapon progress before it goes on-chain, with the game's signer key. The key lives only
// here, in the server-side env SIGNER_KEY (no VITE_ prefix), so it never reaches a browser.
//
// Before signing, every item is checked against the chain the same way the contract will check it,
// plus one rule the contract cannot check cheaply: the value claimed must fit the growth formula
// for the strike scores claimed. Anything that fails gets a clear error and no signature.
//
// Body:     { owner: "0x…", items: [ { tokenId: "12", stats: { value, points, furnaceMinutes, strikes, totalScore } } ] }
// Response: { items: [ { tokenId, stats, deadline, sig } ] }
//
// Env: SIGNER_KEY (required), FORGE_ADDRESS or VITE_FORGE_ADDRESS, RPC_URL or VITE_RPC_URL
// (falls back to the public RPC of VITE_CHAIN).

import { JsonRpcProvider, Contract, Wallet, AbiCoder, keccak256, getBytes, isAddress } from "ethers";

const MAX_ITEMS = 30;
const TTL = 60 * 60;
const PUBLIC_RPC = {
    bsc: "https://bsc-dataseed.bnbchain.org",
    bscTestnet: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
};
const TYPES = [ "address", "uint256", "string", "address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256" ];
const ABI = [
    "function getSword(uint256) view returns (tuple(uint256 value, uint256 points, uint256 furnaceMinutes, uint256 strikes, uint256 totalScore, uint256 syncedAt, uint256 listPrice, uint256 mintPrice, uint256 seed), address, uint256)",
    "function furnaceRate() view returns (uint256 pointsPerHour, uint256 strikesPerMonth, uint256 maxPoints)",
    "function maxValue(uint256 value, uint256 strikes) view returns (uint256)",
];

class Refused extends Error {}
const refuse = (message) => {
    throw new Refused(message);
};

let cached = null;
const setup = async () => {
    if (cached) return cached;
    const key = process.env.SIGNER_KEY;
    const forgeAddress = process.env.FORGE_ADDRESS || process.env.VITE_FORGE_ADDRESS;
    const rpc = process.env.RPC_URL || process.env.VITE_RPC_URL || PUBLIC_RPC[process.env.VITE_CHAIN || "bsc"];
    if (!key || !isAddress(forgeAddress || "") || !rpc) throw new Error("Signer is not configured (SIGNER_KEY, FORGE_ADDRESS, RPC_URL)");
    const provider = new JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });
    const { chainId } = await provider.getNetwork();
    cached = { provider, chainId, forgeAddress, signer: new Wallet(key), forge: new Contract(forgeAddress, ABI, provider) };
    return cached;
};

/**
 * Highest value the growth formula allows for `strikes` strikes averaging `avgScore`, starting
 * from `value` (wei). Same formula as the game engine; the average gives an upper bound.
 */
const formulaCap = (value, strikes, avgScore, strikesPerMonth) => {
    let v = Number(value) / 1e18;
    const s = Math.max(0, Math.min(100, avgScore));
    for (let i = 0; i < strikes; i++) {
        const rate = 0.04 + 0.04 * Math.min(v, 5000) / 5000 + 0.06 * s / 100;
        v *= Math.pow(1 + rate, 1 / strikesPerMonth);
    }
    return v;
};

const big = (x, label) => {
    try {
        const n = BigInt(String(x));
        if (n < 0n) throw new Error();
        return n;
    } catch {
        return refuse(`${label} is not a valid number`);
    }
};

/** Same checks as ForgeEngine._applyStats, plus the score-vs-value rule */
const check = async (ctx, owner, tokenId, stats, now, rate) => {
    const [ s, holder, nonce ] = await ctx.forge.getSword(tokenId);
    if (String(holder).toLowerCase() !== owner) refuse(`Weapon #${tokenId} is not in this wallet`);

    const next = {
        value: big(stats?.value, "value"),
        points: big(stats?.points, "points"),
        furnaceMinutes: big(stats?.furnaceMinutes, "furnaceMinutes"),
        strikes: big(stats?.strikes, "strikes"),
        totalScore: big(stats?.totalScore, "totalScore"),
    };
    if (next.value < s.value || next.furnaceMinutes < s.furnaceMinutes || next.strikes < s.strikes || next.totalScore < s.totalScore) {
        refuse(`Newer progress for #${tokenId} is already saved. Refresh the page.`);
    }
    const addedStrikes = next.strikes - s.strikes;
    const addedMinutes = next.furnaceMinutes - s.furnaceMinutes;
    if (addedMinutes > (BigInt(now) - s.syncedAt) / 60n) refuse("Your phone's clock looks ahead of the chain. Try again in a few minutes.");
    if (next.totalScore - s.totalScore > addedStrikes * 100n) refuse(`Strike scores for #${tokenId} do not add up`);
    if (next.points > rate.maxPoints) refuse(`#${tokenId} holds more points than a weapon can`);
    const earnedNow = next.points + next.strikes;
    const earnedBefore = s.points + s.strikes;
    if (earnedNow > earnedBefore && (earnedNow - earnedBefore) * 60n > addedMinutes * rate.pointsPerHour) {
        refuse("Your phone's clock looks ahead of the chain. Try again in a few minutes.");
    }
    if (next.value > await ctx.forge.maxValue(s.value, addedStrikes)) refuse(`Value for #${tokenId} is above the growth cap`);

    // Value must fit the strikes and scores claimed (tiny tolerance for rounding)
    if (addedStrikes > 0n) {
        const avg = Number(next.totalScore - s.totalScore) / Number(addedStrikes);
        const cap = formulaCap(s.value, Number(addedStrikes), avg, Number(rate.strikesPerMonth));
        if (Number(next.value) / 1e18 > cap * (1 + 1e-9) + 1e-12) refuse(`Value for #${tokenId} does not match its strike scores`);
    } else if (next.value !== s.value) {
        refuse(`Value for #${tokenId} cannot grow without strikes`);
    }
    return { next, nonce };
};

const readBody = async (req) => {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string") return JSON.parse(req.body || "{}");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const send = (res, status, body) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Use POST" });
    try {
        const body = await readBody(req);
        const owner = String(body?.owner ?? "").toLowerCase();
        const items = Array.isArray(body?.items) ? body.items : [];
        if (!isAddress(owner)) refuse("Wallet address is not valid");
        if (items.length < 1 || items.length > MAX_ITEMS) refuse(`Sign 1 to ${MAX_ITEMS} weapons at a time`);

        const ctx = await setup();
        const block = await ctx.provider.getBlock("latest");
        const now = Number(block.timestamp);
        const [ pointsPerHour, strikesPerMonth, maxPoints ] = await ctx.forge.furnaceRate();
        const rate = { pointsPerHour, strikesPerMonth, maxPoints };
        const deadline = BigInt(now + TTL);

        const out = [];
        for (const item of items) {
            const tokenId = big(item?.tokenId, "tokenId");
            const { next, nonce } = await check(ctx, owner, tokenId, item?.stats, now, rate);
            const hash = keccak256(AbiCoder.defaultAbiCoder().encode(TYPES, [
                ctx.forgeAddress, ctx.chainId, "STATS", owner, tokenId, nonce,
                next.value, next.points, next.furnaceMinutes, next.strikes, next.totalScore, deadline,
            ]));
            out.push({
                tokenId: tokenId.toString(),
                stats: Object.fromEntries(Object.entries(next).map(([ k, v ]) => [ k, v.toString() ])),
                deadline: deadline.toString(),
                sig: await ctx.signer.signMessage(getBytes(hash)),
            });
        }
        return send(res, 200, { items: out });
    } catch (error) {
        if (error instanceof Refused) return send(res, 400, { error: error.message });
        console.error(error);
        return send(res, 500, { error: "The signer is not available right now. Please try again." });
    }
}
