import "./main.css";
import { box, getRpc, disconnectWallet } from "./web3/connect";
import { Forge } from "./web3/contracts/contract_forge";
import { Coin } from "./web3/contracts/contract_coin";
import { mintSword } from "./web3/intereacts/mintSword";
import { buyListed } from "./web3/intereacts/buyListed";
import { listSword } from "./web3/intereacts/listSword";
import { cancelListing } from "./web3/intereacts/cancelListing";
import { queryMarket, marketUpdatedAt } from "./game/market";
import { signUpload, signUploads } from "./game/signer";
import * as forge from "./game/forge";
import { sendSword } from "./web3/intereacts/sendSword";
import { saveAll } from "./web3/intereacts/saveAll";
import { claimReferral } from "./web3/intereacts/claimReferral";
import { header, bottomNav } from "./componants/header";
import { mint } from "./componants/mint";
import { marketplace, marketResults } from "./componants/marketplace";
import { armory, selectedForSave } from "./componants/armory";
import { profile } from "./componants/profile";
import { footer } from "./componants/footer";
import { notify } from "./componants/txModal";
import { askReferrer } from "./componants/referralSheet";
import { showGame, showScoring, showResult, showPracticeResult, hideStrike } from "./componants/strikeModal";
import { formatDuration } from "./componants/ui";

const REF_KEY = "forge-ref";
const PAGE_SIZE = 20;

let tab = "mint";
let data = {};
let marketQuery = { sort: "newest" };
let marketState = { items: [], total: 0, page: 1, pages: 1, isLoading: true, lookup: null };
let isRefreshingShelf = false;
let marketFresh = false;

/* -------------------------------------------------------------- data */

async function getContractData(wallet) {
    const isConnected = Boolean(wallet?.address);
    const account = wallet?.address ?? box.ZERO;
    const engine = box.createWeb3Contract(Forge, getRpc());
    const coin = box.createWeb3Contract(Coin, getRpc());

    const [ getDappInfo, getShelf, getUserInfo, getAccount, balance, referralPool, getGuild, furnaceRate ] = await Promise.all([
        engine.methods.getDappInfo().call(),
        engine.methods.getShelf().call(),
        isConnected ? engine.methods.getUserInfo(account).call() : [ [], [] ],
        isConnected ? engine.methods.getAccount(account).call() : null,
        isConnected ? coin.methods.balanceOf(account).call() : "0",
        isConnected ? engine.methods.referralPool().call() : "0",
        isConnected ? engine.methods.getGuild(account).call() : null,
        engine.methods.furnaceRate().call(),
    ]);

    // Swords, furnaces and progress come from this phone's storage, on top of the chain snapshot
    const ids = Array.from(getUserInfo?.[0] ?? [], String);
    const chainSwords = Array.from(getUserInfo?.[1] ?? []);
    // Furnace speed is set on-chain by the owner; the engine follows it
    forge.setFurnaceRate(Number(furnaceRate?.[0] ?? 3), Number(furnaceRate?.[2] ?? 1000));
    const game = forge.buildState(account, ids, chainSwords, Number(getAccount?.[0]?.furnaces ?? 3));
    const playerId = String(getAccount?.[0]?.id ?? "0");

    return {
        wallet,
        account: isConnected ? account : "",
        dappInfo: getDappInfo,
        shelf: getShelf,
        userInfo: getUserInfo,
        accountInfo: getAccount,
        balance,
        referralPool,
        // Marketplace tax in basis points, set by the owner with setFeeBps
        feeBps: Number(getDappInfo?.[6] ?? 50),
        guild: getGuild,
        game,
        profile: isConnected ? { stats: forge.getStats(account) } : null,
        playerId,
        // Short invite link by player id
        refLink: isConnected && playerId !== "0" ? `${location.origin}${location.pathname}?ref=${playerId}` : "",
        storedRef: readStoredRef(),
        fetchedAt: Date.now() / 1000,
    };
}

/* ------------------------------------------------------------- paint */

function paint(next) {
    const app = document.querySelector("#app");
    if (!app) return;

    const panel = (id, html) => /*html*/`
        <div data-tab-panel="${id}" class="${id === tab ? "" : "hidden"}" role="tabpanel">${html}</div>
    `;

    app.innerHTML = /*html*/`
        ${header({ ...next, tab })}
        <main class="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
            ${panel("mint", mint(next) + footer(next))}
            ${panel("market", marketplace(next, marketQuery, marketState))}
            ${panel("armory", armory(next))}
            ${panel("profile", profile(next))}
        </main>
        <div class="h-28 sm:h-12" aria-hidden="true"></div>
        ${bottomNav({ tab })}
    `;
    tick();
}

async function refresh() {
    try {
        data = await getContractData(await box.getCurrentState());
        paint(data);
    } catch (err) {
        console.error(err);
        notify.error(err);
    }
}

/** Live clocks without repainting: furnaces and the shelf countdown run between server reads */
function tick() {
    const serverNow = Number(data?.game?.now ?? 0) + (Date.now() / 1000 - Number(data?.fetchedAt ?? Date.now() / 1000));

    const clock = document.querySelector("[data-clock]");
    if (clock && serverNow) clock.textContent = new Date(serverNow * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC";

    document.querySelectorAll("[data-market-age]").forEach((el) => {
        const at = Number(el.dataset.at ?? 0);
        const mins = Math.floor((Date.now() - at) / 60000);
        el.textContent = at ? (mins < 1 ? "Updated just now" : `Updated ${mins}m ago`) : "";
    });

    document.querySelectorAll("[data-countdown]").forEach((el) => {
        const left = Math.max(0, Number(el.dataset.target ?? 0) - serverNow);
        const h = Math.floor(left / 3600);
        const m = Math.floor((left % 3600) / 60);
        const s = Math.floor(left % 60);
        el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

        // New day: fetch the new shelf once
        if (left <= 0 && Number(el.dataset.target) > 0 && !isRefreshingShelf) {
            isRefreshingShelf = true;
            refresh().finally(() => (isRefreshingShelf = false));
        }
    });

    document.querySelectorAll("[data-furnace-elapsed], [data-furnace-points], [data-furnace-bar]").forEach((el) => {
        const cap = Number(el.dataset.cap ?? 86400);
        const heated = Math.max(0, Math.min(serverNow - Number(el.dataset.started ?? serverNow), cap));

        if (el.hasAttribute("data-furnace-elapsed")) el.textContent = formatDuration(heated);
        if (el.hasAttribute("data-furnace-points")) {
            const pph = Number(el.dataset.pph ?? 3);
            const total = Math.min(Number(el.dataset.max ?? 1000), Number(el.dataset.earned ?? 0) + Math.floor(heated * pph / 3600) - Number(el.dataset.strikes ?? 0));
            el.textContent = String(Math.max(0, total));
        }
        if (el.hasAttribute("data-furnace-bar")) {
            el.style.width = `${(heated / cap) * 100}%`;
            const slot = el.closest("[data-furnace-slot]");
            const isFull = heated >= cap;
            slot?.querySelector("[data-furnace-full]")?.classList.toggle("hidden", !isFull);
            slot?.querySelector("[data-furnace-note]")?.classList.toggle("hidden", isFull);
        }
    });
}

setInterval(tick, 1000);

/* ------------------------------------------------------------ market */

const renderMarket = () => {
    const el = document.querySelector("[data-market-results]");
    if (el) el.innerHTML = marketResults(marketState, data?.account);
};

/** Server does the filtering and paging; the page only ever holds what was loaded */
async function loadMarket({ isAppend = false } = {}) {
    const page = isAppend ? marketState.page + 1 : 1;
    marketState = isAppend
        ? { ...marketState, isLoading: true }
        : { items: [], total: 0, page: 1, pages: 1, isLoading: true, lookup: null };
    renderMarket();

    try {
        const res = await queryMarket({ ...marketQuery, page, pageSize: PAGE_SIZE, isFresh: marketFresh });
        marketFresh = false;
        marketState = {
            items: isAppend ? [ ...marketState.items, ...(res?.items ?? []) ] : res?.items ?? [],
            total: Number(res?.total ?? 0),
            page: Number(res?.page ?? page),
            pages: Number(res?.pages ?? 1),
            isLoading: false,
            lookup: null,
            updatedAt: marketUpdatedAt(),
        };
        // Id search with no listing: say who owns it, for deals agreed outside the app
        if (!marketState.total && marketQuery.q) {
            try {
                marketState.lookup = await lookupSword(marketQuery.q);
            } catch (err) {
                marketState.lookup = { error: err?.message };
            }
        }
    } catch (err) {
        console.error(err);
        marketState = { ...marketState, isLoading: false };
        notify.error(err);
    }
    renderMarket();
}

/** Any sword by NFT id, straight from the contract, for deals agreed outside the app */
async function lookupSword(text) {
    const id = String(text ?? "").replace(/[^0-9]/g, "");
    if (!id) throw new Error("Enter an NFT id.");
    const engine = box.createWeb3Contract(Forge, getRpc());
    const [ sword, owner ] = (await engine.methods.getSword(id).call()) ?? [];
    if (!owner || BigInt(owner) === 0n) throw new Error(`NFT #${id} does not exist.`);
    return { tokenId: id, owner: String(owner).toLowerCase(), isListed: BigInt(sword?.listPrice ?? 0) > 0n, sword, isInFurnace: false };
}

/* ---------------------------------------------------------- helpers */

/** Accepts "12.5" style input; anything that is not a plain number becomes 0 */
const toWei = (text) => {
    const [ whole = "0", frac = "" ] = String(text ?? "").trim().split(".");
    if (!/^\d*$/.test(whole) || !/^\d*$/.test(frac)) return 0n;
    return BigInt(whole || "0") * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18) || "0");
};

const readStoredRef = () => {
    try {
        return localStorage.getItem(REF_KEY) ?? "";
    } catch {
        return "";
    }
};

/**
 * Remembers ?ref= from an invite link across refreshes and visits; a different invite link
 * replaces it. Used to fill in the referrer on the first mint.
 */
const captureRef = () => {
    const ref = new URLSearchParams(location.search).get("ref") ?? "";
    // Player id links (?ref=42); older address links still work
    if (!/^\d+$/.test(ref) && !/^0x[a-fA-F0-9]{40}$/.test(ref)) return;
    try {
        localStorage.setItem(REF_KEY, ref.toLowerCase());
    } catch {}
    history.replaceState(null, "", location.pathname);
};

/** The on-chain snapshot of one of the player's swords */
const chainSword = (tokenId) => {
    const ids = Array.from(data?.userInfo?.[0] ?? [], String);
    return data?.userInfo?.[1]?.[ids.indexOf(String(tokenId))] ?? {};
};

const swordFor = (tokenId) => ({ tokenId: String(tokenId), ...chainSword(tokenId), ...(data?.game?.swords?.[String(tokenId)] ?? {}) });

/** Connects first when needed; returns the wallet or null if the player backed out */
async function requireWallet() {
    const wallet = await box.getCurrentState();
    if (wallet?.address) return wallet;
    try {
        return await box.connectAndGetWallet();
    } catch {
        return null;
    }
}

/**
 * Registered wallets pass ZERO; a first purchase asks for the referrer.
 * @returns {Promise<string|null>} null when the player cancelled
 */
async function referrerFor(wallet) {
    if (data?.accountInfo?.[1]) return box.ZERO;

    const engine = box.createWeb3Contract(Forge, getRpc());
    const self = String(wallet?.address ?? "").toLowerCase();
    return askReferrer({
        initial: readStoredRef(),
        resolve: async (ref) => {
            const address = /^\d+$/.test(ref)
                ? String((await engine.methods.accountOfId(ref).call()) ?? "").toLowerCase()
                : ref;
            if (!address || BigInt(address) === 0n) return { error: `There is no player #${ref}.` };
            if (address === self) return { error: "You cannot invite yourself." };
            const [ , isRegistered ] = (await engine.methods.getAccount(address).call()) ?? [];
            return isRegistered ? { address } : { error: "That player has not minted yet. Ask your friend for their invite link." };
        },
    });
}

/** The market cache refreshes by itself; this asks for a fresh read so the player's own change shows */
async function afterListingChange() {
    marketFresh = true;
    if (tab === "market") loadMarket();
}

/** Progress from this phone, checked by the game engine and signed by the app, ready for the chain */
async function signedProgress(tokenId) {
    notify.pending({ stage: "signing" });
    const stats = forge.statsForChain(data?.account, tokenId, chainSword(tokenId));
    return signUpload(data?.account, tokenId, stats);
}

/** Runs one transaction flow with the shared modal and a refresh at the end */
async function runTx(wallet, action, success) {
    try {
        notify.pending({ stage: "checking" });
        const receipt = await action(wallet);
        notify.success({ ...success, hash: receipt?.transactionHash ?? receipt?.hash });
        await refresh();
        return true;
    } catch (err) {
        console.error(err);
        notify.error(err);
        return false;
    }
}

const guard = (fn) => async (...args) => {
    try {
        await fn(...args);
    } catch (err) {
        console.error(err);
        notify.error(err);
    }
};

/* ---------------------------------------------------------- handlers */

window.switchTab = (id) => {
    tab = id;
    document.querySelectorAll("[data-tab-panel]").forEach((el) => {
        el.classList.toggle("hidden", el.dataset.tabPanel !== id);
    });
    // Active styling hangs off aria-selected, so this one attribute is all that changes
    document.querySelectorAll("[data-tab-button]").forEach((el) => {
        el.setAttribute("aria-selected", String(el.dataset.tabButton === id));
    });
    window.scrollTo({ top: 0 });
    if (id === "market") loadMarket();
};

window.connectWallet = guard(async () => {
    try {
        await box.connectAndGetWallet();
    } catch {
        // Closed the modal: nothing to do
    }
});

window.disconnect = guard(async () => {
    await disconnectWallet();
});

window.copyText = guard(async (text, label = "Copied") => {
    await navigator.clipboard.writeText(String(text ?? ""));
    notify.success({ title: label });
});

window.mintShelf = guard(async (round, slot, price) => {
    const wallet = await requireWallet();
    if (!wallet) return;
    const referrer = await referrerFor(wallet);
    if (!referrer) return;

    const isDone = await runTx(
        wallet,
        (w) => mintSword(w, { round, slot, price }, referrer, { onStep: notify.pending }),
        { title: "Weapon minted", desc: "It is in your armory. Heat it to earn strike points." },
    );
    if (isDone) window.switchTab("armory");
});

window.buyListing = guard(async (tokenId, price) => {
    const wallet = await requireWallet();
    if (!wallet) return;
    // Minting creates the game ID; the contract refuses market buys before that
    if (!data?.accountInfo?.[1]) {
        notify.error(new Error("Mint your first weapon to create your game ID, then you can trade."));
        return;
    }

    const isDone = await runTx(
        wallet,
        (w) => buyListed(w, tokenId, BigInt(price ?? 0), { onStep: notify.pending }),
        { title: `NFT #${tokenId} is yours`, desc: "Its history and strike points came with it." },
    );
    if (isDone) await afterListingChange(tokenId);
});

window.listForSale = guard(async (tokenId) => {
    const input = document.querySelector(`[data-list-price="${tokenId}"]`);
    const isDone = await runTx(
        await box.getCurrentState(),
        async (w) => listSword(w, tokenId, toWei(input?.value), await signedProgress(tokenId), { onStep: notify.pending }),
        { title: `NFT #${tokenId} listed`, desc: "It is in the marketplace now. Anyone can find it by its NFT id." },
    );
    if (isDone) await afterListingChange(tokenId);
});

window.cancelSale = guard(async (tokenId) => {
    const isDone = await runTx(
        await box.getCurrentState(),
        (w) => cancelListing(w, tokenId, { onStep: notify.pending }),
        { title: "Listing cancelled", desc: "The weapon is back in your armory." },
    );
    if (isDone) await afterListingChange(tokenId);
});

window.repaintArmory = () => {
    const el = document.querySelector('[data-tab-panel="armory"]');
    if (el) el.innerHTML = armory(data);
    tick();
};

// Save mode confirm: one transaction, one gas fee, for the weapons the player ticked
window.confirmSave = guard(async () => {
    const ids = selectedForSave();
    if (!ids.length) return;

    const isDone = await runTx(
        await box.getCurrentState(),
        async (w) => {
            notify.pending({ stage: "signing" });
            // One request signs every weapon in the batch
            const items = await signUploads(data?.account, ids.map((id) => ({ tokenId: id, stats: forge.statsForChain(data?.account, id, chainSword(id)) })));
            return saveAll(w, items, { onStep: notify.pending });
        },
        { title: `Saved ${ids.length} weapon${ids.length === 1 ? "" : "s"}`, desc: "Progress is on-chain now. Safe to switch phones, list on any marketplace, or clear the browser." },
    );
    if (isDone) window.exitSaveMode();
});

window.sendTo = guard(async (tokenId) => {
    const to = document.querySelector(`[data-send-to="${tokenId}"]`)?.value?.trim() ?? "";
    await runTx(
        await box.getCurrentState(),
        async (w) => sendSword(w, to, tokenId, await signedProgress(tokenId), { onStep: notify.pending }),
        { title: `NFT #${tokenId} sent`, desc: "It arrived with all its progress." },
    );
});

window.heatSword = guard(async (tokenId) => {
    forge.startFurnace(data?.account, tokenId, chainSword(tokenId), data?.game?.furnaces);
    await refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
});

window.takeOut = guard(async (tokenId) => {
    const out = forge.stopFurnace(data?.account, tokenId, chainSword(tokenId));
    notify.success({
        title: `+${Number(out?.earned ?? 0)} strike points`,
        desc: `Heated for ${formatDuration(out?.heated)}. NFT #${tokenId} now has ${Number(out?.points ?? 0)} points to strike.`,
    });
    await refresh();
});

window.openStrike = guard(async (tokenId) => {
    const sword = swordFor(tokenId);
    const session = forge.startStrike(data?.account, tokenId, chainSword(tokenId));

    showGame(session, sword, async (score) => {
        showScoring();
        try {
            const result = forge.finishStrike(data?.account, session, score, chainSword(tokenId));
            // Keep the local copy current so "Strike again" opens with the new value
            if (data?.game?.swords?.[String(tokenId)]) {
                Object.assign(data.game.swords[String(tokenId)], { value: result?.value, points: result?.points });
            }
            showResult(result, sword);
        } catch (err) {
            console.error(err);
            hideStrike();
            notify.error(err);
            await refresh();
        }
    });
});

// Practice: the real minigame on a random weapon; no wallet, points or storage involved
window.openPractice = () => {
    const roll = forge.practiceRoll();
    const sword = { seed: roll.weaponSeed };
    showGame(roll, sword, (score) => showPracticeResult(score, sword));
};

// An unfinished strike is just dropped; it never touched storage
window.closeStrike = async () => {
    hideStrike();
    await refresh();
};

/* ----------------------------------------------------- market search */

window.searchMarket = (event) => {
    event?.preventDefault?.();
    marketQuery = { ...marketQuery, q: document.querySelector("[data-market-q]")?.value?.trim() ?? "" };
    loadMarket();
};

window.sortMarket = (sort) => {
    marketQuery = { ...marketQuery, sort };
    loadMarket();
};

window.applyFilters = () => {
    marketQuery = {
        ...marketQuery,
        minPrice: document.querySelector("[data-filter-min]")?.value || "",
        maxPrice: document.querySelector("[data-filter-max]")?.value || "",
        grade: document.querySelector("[data-filter-grade]:checked")?.value ?? "",
        isUnderValue: Boolean(document.querySelector("[data-filter-under]")?.checked),
    };
    paint(data);
    loadMarket();
};

window.clearFilters = () => {
    marketQuery = { sort: marketQuery.sort ?? "newest", q: marketQuery.q ?? "" };
    paint(data);
    loadMarket();
};

window.loadMoreMarket = () => loadMarket({ isAppend: true });

window.claimReferralIncome = () => runTx(
    null,
    async () => claimReferral(await box.getCurrentState(), { onStep: notify.pending }),
    { title: "Referral income claimed", desc: "The coins are in your wallet." },
);

// The market re-reads the chain every 5 minutes while it is open
setInterval(() => {
    if (tab === "market") loadMarket();
}, 5 * 60 * 1000);

window.refreshMarket = () => {
    marketFresh = true;
    loadMarket();
};

/* -------------------------------------------------------------- boot */

captureRef();

// kitbox calls this on load and whenever the wallet or network changes
box.safeRenderApp(async () => {
    await refresh();
    loadMarket();
});
