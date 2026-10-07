import { box, getRpc } from "../web3/connect";
import { Forge } from "../web3/contracts/contract_forge";

// Market search with no server: read every listing from the contract in parallel pages,
// keep them for 5 minutes (or until the player taps Refresh), then filter, sort and page on the phone.

const PAGE = 300;
const PARALLEL = 4;
const CACHE_MS = 5 * 60 * 1000;          // auto refresh every 5 minutes; the Refresh button skips the wait
const PAGE_SIZE_MAX = 50;

let cache = { items: [], at: 0 };
let loading = null;

const toEntry = (tokenId, sword, seller) => ({
    tokenId: String(tokenId),
    seller: String(seller ?? "").toLowerCase(),
    price: String(sword?.listPrice ?? 0),
    value: String(sword?.value ?? 0),
    strikes: Number(sword?.strikes ?? 0),
    totalScore: Number(sword?.totalScore ?? 0),
    furnaceMinutes: Number(sword?.furnaceMinutes ?? 0),
    points: Number(sword?.points ?? 0),
    seed: String(sword?.seed ?? 0),
    // list() writes syncedAt, so it doubles as the listing time
    listedAt: Number(sword?.syncedAt ?? 0),
});

async function load() {
    const engine = box.createWeb3Contract(Forge, getRpc());
    const info = await engine.methods.getDappInfo().call();
    const total = Number(info?.[1] ?? 0);
    const offsets = Array.from({ length: Math.ceil(total / PAGE) }, (_, i) => i * PAGE);

    const items = [];
    for (let i = 0; i < offsets.length; i += PARALLEL) {
        const pages = await Promise.all(offsets.slice(i, i + PARALLEL).map((offset) => engine.methods.getListings(offset, PAGE).call()));
        pages.forEach((page) => {
            Array.from(page?.[0] ?? []).forEach((id, j) => items.push(toEntry(id, page?.[1]?.[j], page?.[2]?.[j])));
        });
    }
    cache = { items, at: Date.now() };
    return items;
}

/** @param {boolean} isFresh  the player just listed or bought; skip the cache */
async function listings(isFresh) {
    if (!isFresh && Date.now() - cache.at < CACHE_MS) return cache.items;
    loading ??= load().finally(() => (loading = null));
    return loading;
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const avgOf = (x) => (x.strikes ? x.totalScore / x.strikes : -1);
const GRADE_RANGES = { S: [ 95, 101 ], A: [ 85, 95 ], B: [ 70, 85 ], C: [ 50, 70 ], D: [ 0, 50 ] };

const SORTS = {
    newest:     (a, b) => b.listedAt - a.listedAt || cmp(BigInt(b.tokenId), BigInt(a.tokenId)),
    oldest:     (a, b) => a.listedAt - b.listedAt || cmp(BigInt(a.tokenId), BigInt(b.tokenId)),
    price_asc:  (a, b) => cmp(BigInt(a.price), BigInt(b.price)),
    price_desc: (a, b) => cmp(BigInt(b.price), BigInt(a.price)),
    value_desc: (a, b) => cmp(BigInt(b.value), BigInt(a.value)),
    deal:       (a, b) => cmp(BigInt(a.price) * BigInt(b.value), BigInt(b.price) * BigInt(a.value)),
    quality:    (a, b) => avgOf(b) - avgOf(a),
};

const toWei = (coins) => {
    const n = Number(coins);
    return Number.isFinite(n) && n > 0 ? BigInt(Math.round(n * 1e4)) * 10n ** 14n : null;
};

/**
 * @param {{ q?: string, minPrice?: number, maxPrice?: number, grade?: string, isUnderValue?: boolean, sort?: string, page?: number, pageSize?: number, isFresh?: boolean }} params
 * @returns {Promise<{ items: object[], total: number, page: number, pages: number }>}
 */
async function queryMarket(params = {}) {
    const id = String(params?.q ?? "").replace(/[^0-9]/g, "");
    const min = toWei(params?.minPrice);
    const max = toWei(params?.maxPrice);
    const range = GRADE_RANGES[String(params?.grade ?? "")];
    const pageSize = Math.max(1, Math.min(PAGE_SIZE_MAX, Number(params?.pageSize) || 20));
    const page = Math.max(1, Number(params?.page) || 1);

    let items = [ ...(await listings(Boolean(params?.isFresh))) ];
    if (id) items = items.filter((x) => x.tokenId === id);
    if (min !== null) items = items.filter((x) => BigInt(x.price) >= min);
    if (max !== null) items = items.filter((x) => BigInt(x.price) <= max);
    if (range) items = items.filter((x) => x.strikes > 0 && avgOf(x) >= range[0] && avgOf(x) < range[1]);
    if (params?.isUnderValue) items = items.filter((x) => BigInt(x.price) < BigInt(x.value));
    items.sort(SORTS[params?.sort] ?? SORTS.newest);

    const total = items.length;
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** When the listings were last read from the chain, in ms; 0 before the first read */
const marketUpdatedAt = () => cache.at;

export { queryMarket, marketUpdatedAt };
