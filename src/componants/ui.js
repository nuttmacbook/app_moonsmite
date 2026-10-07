import { formNumber } from "../web3/connect";
import { nowSec } from "../game/clock";

// Shared class strings and tiny helpers, so every panel reads the same

const CARD = "hud";
const EYEBROW = "text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/80 sm:text-[11px]";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950";

// Game coin: MoonWorld (MWLD)
const TICKER = "MWLD";
const COIN_ICON = "https://www.moonworld.app/logo.png";

// Colors from the MoonWorld banner: gold like the logo frame, gem blue, nebula violet.
// Outer glows would be cut off by the chamfer, so buttons glow from the inside.
const BUTTON = {
    primary: `cut inline-flex items-center justify-center gap-2 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-wider text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(146,64,14,0.45)] transition hover:from-amber-100 hover:to-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`,
    heat:    `cut inline-flex items-center justify-center gap-2 bg-gradient-to-b from-fuchsia-400 to-violet-600 px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-wider text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_0_16px_rgba(240,171,252,0.45)] transition hover:from-fuchsia-300 hover:to-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`,
    ghost:   `cut inline-flex items-center justify-center gap-2 bg-white/[0.05] px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-wider text-amber-50 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.35),inset_0_0_14px_rgba(99,102,241,0.2)] backdrop-blur transition hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`,
    small:   `cut inline-flex items-center justify-center gap-1 bg-white/[0.05] px-2.5 py-1 font-mono text-xs font-semibold text-amber-50 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.3)] transition hover:bg-white/10 ${FOCUS}`,
};

const BADGES = {
    idle:    "bg-slate-400/10 text-slate-300 ring-slate-300/20",
    heating: "bg-amber-400/15 text-amber-200 ring-amber-300/40",
    listed:  "bg-sky-400/10 text-sky-200 ring-sky-300/40",
    good:    "bg-emerald-400/10 text-emerald-300 ring-emerald-300/30",
    bad:     "bg-rose-500/10 text-rose-300 ring-rose-400/30",
};

const badge = (text, tone = "idle") => /*html*/`
    <span class="inline-flex shrink-0 items-center px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${BADGES[tone] ?? BADGES.idle}">${text}</span>
`;

/** Coins from wei; values use 4 decimals because one strike on a small sword moves less than 0.01 */
const coins = (wei, fixed = 2) => formNumber(wei ?? 0, 18, fixed);

const coinIcon = (cls = "") => `<img src="${COIN_ICON}" alt="${TICKER}" width="16" height="16" class="coin ${cls}" loading="lazy">`;

/** Amount with the MWLD coin in front */
const money = (wei, fixed = 2) => `<span class="inline-flex items-center gap-1 whitespace-nowrap">${coinIcon()}${coins(wei, fixed)}</span>`;

/** How long ago something was listed, in hours: "<1h", "5h", "53h" */
const listedFor = (listedAt, now = nowSec()) => {
    const hours = Math.max(0, (Number(now) - Number(listedAt ?? 0)) / 3600);
    return hours < 1 ? "<1h" : `${Math.floor(hours).toLocaleString()}h`;
};

/** Marketplace tax from the contract (basis points) as text, e.g. 50 -> "0.5%" */
const taxText = (bps) => `${+(Number(bps ?? 50) / 100).toFixed(2)}%`;

/** Down chevron for collapsible headers; turns when the <details> is open */
const chevron = `<svg viewBox="0 0 20 20" class="chevron h-4 w-4 shrink-0 text-amber-200/70 transition-transform" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const formatDuration = (seconds) => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s % 60).padStart(2, "0")}s`;
};

const stat = (label, value, tone = "text-slate-100") => /*html*/`
    <div class="min-w-0">
        <p class="truncate text-[10px] uppercase tracking-wider text-slate-500">${label}</p>
        <p class="truncate font-mono text-[13px] font-semibold tabular-nums ${tone}">${value}</p>
    </div>
`;

/** Price versus real value, the number a buyer cares about most */
const dealBadge = (priceWei, valueWei) => {
    const price = BigInt(priceWei ?? 0);
    const value = BigInt(valueWei ?? 0);
    if (value <= 0n) return "";
    const pct = Number((price - value) * 10000n / value) / 100;
    if (Math.abs(pct) < 0.01) return badge("At value", "idle");
    return pct < 0
        ? badge(`${Math.abs(pct).toFixed(2)}% under value`, "good")
        : badge(`${pct.toFixed(2)}% over value`, "bad");
};

/** NFT id is shown everywhere so players can find each other's swords for deals made outside the app */
const nftTag = (id) => /*html*/`
    <span class="inline-flex shrink-0 items-center rounded bg-sky-400/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-sky-200 ring-1 ring-inset ring-sky-300/30">#${id}</span>
`;

const timeAgo = (seconds) => {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

const connectPrompt = (title, desc) => /*html*/`
    <div class="${CARD} flex flex-col items-start gap-3 p-5">
        <div>
            <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">${title}</h2>
            <p class="mt-1 text-sm text-slate-400">${desc}</p>
        </div>
        <button type="button" onclick="connectWallet()" class="${BUTTON.primary}">Connect wallet</button>
    </div>
`;

const pageTitle = (eyebrow, title, desc = "") => /*html*/`
    <div class="min-w-0">
        <p class="${EYEBROW}">${eyebrow}</p>
        <h1 class="font-display text-lg font-semibold uppercase tracking-wide text-amber-50 drop-shadow-[0_0_14px_rgba(252,211,77,0.35)] sm:text-2xl">${title}</h1>
        ${desc ? `<p class="mt-1 max-w-xl text-[13px] text-slate-300/80">${desc}</p>` : ""}
    </div>
`;

export { CARD, EYEBROW, FOCUS, BUTTON, TICKER, badge, coins, coinIcon, money, chevron, taxText, listedFor, formatDuration, stat, dealBadge, nftTag, timeAgo, connectPrompt, pageTitle };
