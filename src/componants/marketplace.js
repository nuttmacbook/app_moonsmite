import { shortAddress } from "../web3/connect";
import { itemArt, itemName, gradeOf } from "./itemArt";
import { CARD, BUTTON, FOCUS, TICKER, coins, money, chevron, taxText, listedFor, stat, dealBadge, nftTag, formatDuration, pageTitle } from "./ui";

const SORTS = [
    { id: "newest",     label: "Newest" },
    { id: "oldest",     label: "Listed longest" },
    { id: "deal",       label: "Best deal" },
    { id: "price_asc",  label: "Price: low to high" },
    { id: "price_desc", label: "Price: high to low" },
    { id: "value_desc", label: "Highest value" },
    { id: "quality",    label: "Best quality" },
];

const GRADES = [ "", "S", "A", "B", "C", "D" ];

if (typeof window !== "undefined") {
    window.toggleFilters = () => {
        const panel = document.querySelector("[data-filter-panel]");
        const isOpen = panel?.classList.toggle("hidden") === false;
        document.querySelector("[data-filter-toggle]")?.setAttribute("aria-expanded", String(isOpen));
    };
}

/** Compact row: weapon, price and Buy always visible; stats behind "Details" */
const listingCard = (item, account) => {
    const grade = gradeOf(item?.totalScore, item?.strikes);
    const isMine = String(item?.seller ?? "").toLowerCase() === String(account ?? "").toLowerCase();

    return /*html*/`
    <article class="${CARD} cv-auto flex min-w-0 flex-col gap-2 p-2.5">
        <div class="flex min-w-0 items-center gap-2.5">
            <div class="grid h-16 w-16 shrink-0 place-items-center bg-[radial-gradient(circle,rgba(252,211,77,0.14),transparent_70%)]">${itemArt(item?.seed, { glow: grade.glow, className: "h-16 w-16" })}</div>
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">${nftTag(item?.tokenId)}<h3 class="truncate text-[13px] font-semibold text-amber-50">${itemName(item?.seed)}</h3></div>
                <div class="mt-0.5 flex flex-wrap items-center gap-1.5">${dealBadge(item?.price, item?.value)}</div>
                <p class="mt-0.5 text-[11px] text-slate-400">Value <span class="font-mono text-emerald-300">${coins(item?.value, 2)}</span> · ${grade.avg ? `Grade ${grade.label}` : "Unstruck"}</p>
                <p class="mt-0.5 text-[11px] text-slate-500">Listed <span class="font-mono text-slate-300">${listedFor(item?.listedAt)}</span> ago</p>
            </div>
            <div class="shrink-0 text-right">
                <p class="font-mono text-[15px] font-semibold tabular-nums text-amber-100">${money(item?.price, 2)}</p>
                ${isMine
                    ? `<button type="button" onclick="cancelSale('${item?.tokenId}')" class="${BUTTON.small} mt-1">Cancel</button>`
                    : `<button type="button" onclick="buyListing('${item?.tokenId}', '${item?.price}')" class="${BUTTON.primary} mt-1 px-3 py-1.5">Buy</button>`}
            </div>
        </div>

        <details>
            <summary class="flex items-center justify-between text-[11px] text-slate-400"><span>Details</span>${chevron}</summary>
            <div class="mt-2 grid grid-cols-4 gap-2 border-t border-amber-200/10 pt-2">
                ${stat("Grade", grade.avg ? `${grade.label} ${grade.avg.toFixed(0)}` : "—", grade.tone)}
                ${stat("Strikes", Number(item?.strikes ?? 0).toLocaleString())}
                ${stat("Heated", formatDuration(Number(item?.furnaceMinutes ?? 0) * 60))}
                ${stat("Points", Number(item?.points ?? 0).toLocaleString(), "text-amber-200")}
            </div>
            <p class="mt-2 text-[11px] text-slate-500">Seller ${isMine ? "you" : shortAddress(item?.seller)}. Real value ${coins(item?.value, 4)} ${TICKER}.</p>
        </details>
    </article>
    `;
};

/** Shown when an id search finds no listing, so a buyer knows what to ask their friend */
const lookupCard = (lookup, account) => {
    if (!lookup) return "";
    if (lookup.error) {
        return `<div class="${CARD} p-4 text-sm text-slate-300">${lookup.error}</div>`;
    }
    const isMine = String(lookup.owner ?? "").toLowerCase() === String(account ?? "").toLowerCase();
    const status = lookup.isInFurnace ? "is heating in a furnace" : "is not listed for sale";

    return /*html*/`
    <div class="${CARD} flex min-w-0 items-center gap-3 p-4">
        <div class="grid h-14 w-14 shrink-0 place-items-center">${itemArt(lookup?.sword?.seed, { className: "h-14 w-14" })}</div>
        <div class="min-w-0 text-sm">
            <div class="flex flex-wrap items-center gap-2">${nftTag(lookup.tokenId)}<span class="truncate font-semibold text-white">${itemName(lookup?.sword?.seed)}</span></div>
            <p class="mt-1 text-slate-400">${isMine ? "This is your weapon. List it from your armory to sell it." : `Owned by ${shortAddress(lookup.owner)} and ${status}. Ask the owner to list it at your agreed price, then search again.`}</p>
        </div>
    </div>
    `;
};

/**
 * Only the result area, re-rendered on every search so the filter inputs keep focus
 * @param {{ items: object[], total: number, page: number, pages: number, lookup?: object, isLoading?: boolean }} state
 */
const marketResults = (state, account) => {
    const items = Array.isArray(state?.items) ? state.items : [];
    const total = Number(state?.total ?? 0);
    const hasMore = Number(state?.page ?? 1) < Number(state?.pages ?? 1);

    if (state?.isLoading && items.length === 0) {
        return `<p class="py-10 text-center text-sm text-slate-500">Loading weapons…</p>`;
    }

    return /*html*/`
        <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-slate-500">${total === 0 ? "No weapons match." : `Showing ${items.length.toLocaleString()} of ${total.toLocaleString()}`}</p>
            <div class="flex items-center gap-2">
                <span data-market-age data-at="${Number(state?.updatedAt ?? 0)}" class="font-mono text-[11px] text-slate-500"></span>
                <button type="button" onclick="refreshMarket()" class="${BUTTON.small}" ${state?.isLoading ? "disabled" : ""}>Refresh</button>
            </div>
        </div>
        ${items.length === 0 ? (state?.lookup ? lookupCard(state.lookup, account) : /*html*/`
            <div class="${CARD} p-5 text-sm text-slate-400">Nothing listed matches these filters. Clear them, or list one of your weapons.</div>
        `) : /*html*/`
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                ${items.map((item) => listingCard(item, account)).join("")}
            </div>
        `}
        ${hasMore ? `<button type="button" onclick="loadMoreMarket()" class="${BUTTON.ghost} mx-auto w-full sm:w-auto" ${state?.isLoading ? "disabled" : ""}>${state?.isLoading ? "Loading…" : "Load more"}</button>` : ""}
    `;
};

const marketplace = (data, query, state) => {
    const q = query ?? {};
    const activeFilters = [ q.minPrice, q.maxPrice, q.grade, q.isUnderValue ].filter(Boolean).length;
    const input = `cut w-full min-w-0 bg-indigo-950/70 px-3 py-2.5 text-sm text-white ring-1 ring-inset ring-amber-200/25 placeholder:text-slate-500 ${FOCUS}`;

    return /*html*/`
    <section class="flex flex-col gap-4">
        ${pageTitle("Marketplace", "Trade weapons", `Real value is on-chain, so you can spot a bargain. Sellers pay ${taxText(data?.feeBps)} tax, burned.`)}

        <div class="flex flex-col gap-2 sm:flex-row">
        <!-- ค้นหาด้วย NFT ID -->
        <form onsubmit="searchMarket(event)" class="flex gap-2 sm:flex-1" role="search">
            <label for="market-q" class="sr-only">NFT ID</label>
            <input id="market-q" data-market-q type="text" inputmode="numeric" placeholder="Search NFT ID, e.g. 1024" value="${q.q ?? ""}" class="${input}">
            <button type="submit" class="${BUTTON.primary} shrink-0">Search</button>
        </form>

        <div class="flex gap-2 sm:w-[22rem]">
            <label for="market-sort" class="sr-only">Sort</label>
            <select id="market-sort" onchange="sortMarket(this.value)" class="${input} flex-1">
                ${SORTS.map((s) => `<option value="${s.id}" ${s.id === (q.sort ?? "newest") ? "selected" : ""}>${s.label}</option>`).join("")}
            </select>
            <button type="button" data-filter-toggle aria-expanded="false" onclick="toggleFilters()" class="${BUTTON.ghost} shrink-0">
                Filters${activeFilters ? ` <span class="bg-cyan-400/20 px-1.5 font-mono text-xs text-cyan-100">${activeFilters}</span>` : ""}
            </button>
        </div>
        </div>

        <!-- ตัวกรอง -->
        <div data-filter-panel class="hidden ${CARD} flex flex-col gap-4 p-4">
            <div class="grid grid-cols-2 gap-2">
                <label class="text-xs text-slate-400">Min price
                    <input data-filter-min type="number" inputmode="decimal" min="0" value="${q.minPrice ?? ""}" placeholder="0" class="${input} mt-1 font-mono">
                </label>
                <label class="text-xs text-slate-400">Max price
                    <input data-filter-max type="number" inputmode="decimal" min="0" value="${q.maxPrice ?? ""}" placeholder="Any" class="${input} mt-1 font-mono">
                </label>
            </div>

            <fieldset>
                <legend class="text-xs text-slate-400">Grade</legend>
                <div class="mt-2 flex flex-wrap gap-2">
                    ${GRADES.map((g) => /*html*/`
                        <label class="cursor-pointer">
                            <input type="radio" name="grade" value="${g}" data-filter-grade class="peer sr-only" ${g === (q.grade ?? "") ? "checked" : ""}>
                            <span class="cut block px-3 py-1.5 font-mono text-sm font-semibold text-slate-300 ring-1 ring-inset ring-cyan-300/20 peer-checked:bg-cyan-400/15 peer-checked:text-cyan-100 peer-checked:ring-cyan-300/60 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300">${g || "Any"}</span>
                        </label>
                    `).join("")}
                </div>
            </fieldset>

            <label class="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" data-filter-under class="h-4 w-4 accent-cyan-400" ${q.isUnderValue ? "checked" : ""}>
                Only weapons priced under their real value
            </label>

            <div class="flex gap-2">
                <button type="button" onclick="applyFilters()" class="${BUTTON.primary} flex-1">Apply</button>
                <button type="button" onclick="clearFilters()" class="${BUTTON.ghost}">Clear</button>
            </div>
        </div>

        <div data-market-results class="flex flex-col gap-3">${marketResults(state, data?.account)}</div>
    </section>
    `;
};

export { marketplace, marketResults };
