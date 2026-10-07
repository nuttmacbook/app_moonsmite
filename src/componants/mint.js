import { shortAddress } from "../web3/connect";
import { itemArt, itemName } from "./itemArt";
import { CARD, BUTTON, money, pageTitle } from "./ui";

/** Copies left this hour; null when the owner set no limit */
const leftOf = (minted, limit) => (limit > 0 ? Math.max(0, limit - minted) : null);

const shelfCard = (round, slot, price, seed, minted, limit) => {
    const left = leftOf(minted, limit);
    const isSoldOut = left === 0;
    return /*html*/`
    <article class="${CARD} flex min-w-0 flex-col items-center gap-1.5 p-2.5 text-center ${isSoldOut ? "opacity-60" : ""}">
        ${left !== null ? `<span class="absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${isSoldOut ? "bg-slate-700/80 text-slate-300" : left === 1 ? "bg-red-500/20 text-red-200" : "bg-white/10 text-slate-200"}">${isSoldOut ? "Sold out" : `${left} left`}</span>` : ""}
        <div class="grid place-items-center bg-[radial-gradient(circle,rgba(252,211,77,0.16),transparent_70%)]">${itemArt(seed, { className: "h-24 w-24 sm:h-32 sm:w-32" })}</div>
        <div class="w-full min-w-0">
            <h3 class="truncate text-[13px] font-semibold text-amber-50">${itemName(seed)}</h3>
        </div>
        ${isSoldOut
            ? `<p class="w-full py-2 text-[11px] text-slate-400">Back next hour</p>`
            : `<button type="button" onclick="mintShelf('${round}', ${slot}, '${price}')" class="${BUTTON.primary} w-full px-2 py-2 font-mono text-[13px]">${money(price, 0)}</button>`}
    </article>
    `;
};

/** Who invited this browser: a player id (#42) or an address from an older link */
const inviterLabel = (ref) => (/^\d+$/.test(String(ref)) ? `player #${ref}` : shortAddress(ref));

const mint = (data) => {
    const [ round, prices, seeds, refreshAt, minted, limit ] = Array.isArray(data?.shelf) ? data.shelf : [ 0, [], [], 0, [], 0 ];
    const cap = Number(limit ?? 0);
    const list = Array.from(prices ?? [], String);
    const isRegistered = Boolean(data?.accountInfo?.[1]);

    return /*html*/`
    <section class="flex flex-col gap-4">
        <div class="flex items-end justify-between gap-3">
            ${pageTitle("Lunar supply drop", "Mint a weapon")}
            <div class="shrink-0 text-right">
                <p class="text-[10px] uppercase tracking-wider text-slate-400">New in</p>
                <p data-countdown data-target="${Number(refreshAt ?? 0)}" class="font-mono text-sm font-semibold tabular-nums text-amber-200">—</p>
            </div>
        </div>

        <details class="${CARD} px-3 py-2 text-[13px] text-slate-300">
            <summary class="flex items-center justify-between gap-2">
                <span>${!isRegistered && data?.storedRef ? `Invited by <span class="font-mono text-amber-200">${inviterLabel(data.storedRef)}</span>` : `10 weapons, new set every hour${cap > 0 ? `, ${cap} of each` : ""}`}</span>
                <span class="text-[11px] text-amber-200/80">How it works</span>
            </summary>
            <p class="mt-2 text-xs text-slate-400">${cap > 0 ? `Each weapon can be minted ${cap} times this hour by all players together. When one sells out, a new shelf comes next hour.` : "Mint any weapon as many times as you like."} Its value starts at the price and grows as you heat and strike it.${!isRegistered ? " Your first mint creates your game ID under whoever invited you." : ""}</p>
            <button type="button" onclick="openPractice()" class="${BUTTON.ghost} mt-3 w-full">Try a practice strike</button>
        </details>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            ${list.map((price, i) => shelfCard(String(round), i, price, String(seeds?.[i] ?? 0), Number(minted?.[i] ?? 0), cap)).join("")}
        </div>
    </section>
    `;
};

export { mint };
