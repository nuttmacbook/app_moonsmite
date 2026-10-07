import { itemArt, itemName, gradeOf } from "./itemArt";
import { CARD, BUTTON, FOCUS, TICKER, taxText, listedFor, badge, coins, money, chevron, stat, nftTag, formatDuration, connectPrompt, pageTitle } from "./ui";

const PAGE = 24;
const MAX_SAVE = 30;
const STALE_HOURS = 24;

// View state for the armory list; survives repaints, resets on reload
const view = { status: "all", sort: "unsaved", shown: PAGE, isSaveMode: false, selected: new Set(), open: new Set() };

const STATUSES = [
    { id: "all",     label: "All" },
    { id: "unsaved", label: "Unsaved" },
    { id: "idle",    label: "Idle" },
    { id: "heating", label: "Heating" },
    { id: "listed",  label: "Listed" },
];

const SORTS = [
    { id: "unsaved", label: "Unsaved longest" },
    { id: "value",   label: "Highest value" },
    { id: "points",  label: "Most points" },
    { id: "newest",  label: "Newest" },
];

if (typeof window !== "undefined") {
    // Opens one sword's sale form and closes the rest, no re-render so typed prices survive
    window.toggleListForm = (id) => {
        document.querySelectorAll("[data-list-panel]").forEach((el) => {
            el.classList.toggle("hidden", el.dataset.listPanel !== String(id) || !el.classList.contains("hidden"));
        });
        const input = document.querySelector(`[data-list-price="${id}"]`);
        input?.focus();
        window.updateNet(id, input?.value);
    };

    // Send form, same pattern as the sale form
    window.toggleSendForm = (id) => {
        document.querySelectorAll("[data-send-panel]").forEach((el) => {
            el.classList.toggle("hidden", el.dataset.sendPanel !== String(id) || !el.classList.contains("hidden"));
        });
        document.querySelector(`[data-send-to="${id}"]`)?.focus();
    };

    const repaint = () => window.repaintArmory?.();

    // Remember which cards are expanded, so repaints after an action keep them open
    window.setCardOpen = (id, isOpen) => {
        if (isOpen) view.open.add(String(id));
        else view.open.delete(String(id));
    };

    window.setArmoryStatus = (id) => {
        view.status = id;
        view.shown = PAGE;
        repaint();
    };
    window.setArmorySort = (id) => {
        view.sort = id;
        repaint();
    };
    window.showMoreArmory = () => {
        view.shown += PAGE;
        repaint();
    };

    /** Save mode: tick the weapons to upload, then confirm once */
    window.enterSaveMode = (preselect = []) => {
        view.isSaveMode = true;
        view.selected = new Set(preselect.map(String));
        repaint();
    };
    window.exitSaveMode = () => {
        view.isSaveMode = false;
        view.selected.clear();
        repaint();
    };
    window.toggleSaveSelect = (id) => {
        const key = String(id);
        if (view.selected.has(key)) view.selected.delete(key);
        else view.selected.add(key);
        repaint();
    };
    window.selectAllSavable = (isOn) => {
        view.selected = new Set(isOn ? (window.__savableIds ?? []).slice(0, MAX_SAVE) : []);
        repaint();
    };

    /** What the seller actually receives after the burned marketplace tax */
    window.updateNet = (id, value) => {
        const el = document.querySelector(`[data-list-net="${id}"]`);
        const price = Number(value);
        if (!el) return;
        // Tax comes from the contract (getDappInfo), read on every refresh
        const feeBps = Number(el.dataset.feeBps ?? 50);
        el.textContent = Number.isFinite(price) && price > 0 ? (price * (10000 - feeBps) / 10000).toFixed(4) : "0.0000";
    };
}

/** Small glowing ring with the weapon inside; the only ambient motion in the app */
const reactor = (seed, isLit) => /*html*/`
    <div class="relative grid h-14 w-14 shrink-0 place-items-center">
        ${isLit ? `<div class="reactor absolute inset-0 rounded-full"></div>` : `<div class="absolute inset-0 rounded-full ring-1 ring-inset ring-slate-500/40"></div>`}
        <div class="${isLit ? "reactor-core" : "bg-indigo-950/60"} absolute inset-1.5 rounded-full"></div>
        ${isLit ? `<div class="heat-img relative">${itemArt(seed, { className: "h-10 w-10" })}</div>` : ""}
    </div>
`;

/** Furnace speed in plain words, from points per hour on the contract */
const perMinuteText = (pph) => {
    const perHour = Number(pph ?? 3);
    if (perHour >= 60) return perHour === 60 ? "1 point a minute" : `${+(perHour / 60).toFixed(2)} points a minute`;
    return perHour === 1 ? "1 point an hour" : `${perHour} points an hour`;
};

const furnaceSlot = (item, index, swordsById, rules) => {
    const cap = Number(rules?.furnaceCap ?? 86400);
    const pph = Number(rules?.pointsPerHour ?? 3);
    const maxPoints = Number(rules?.maxPoints ?? 1000);

    if (!item) {
        return /*html*/`
        <div class="${CARD} flex items-center gap-3 p-2.5 opacity-70">
            ${reactor(0, false)}
            <p class="text-xs text-slate-400"><span class="font-semibold text-slate-200">Furnace ${index + 1}</span> idle. Tap Heat on a weapon.</p>
        </div>
        `;
    }

    const id = String(item.tokenId);
    const sword = swordsById[id];

    return /*html*/`
    <div data-furnace-slot class="${CARD} burning flex items-center gap-3 p-2.5" aria-label="Furnace ${index + 1} is burning">
        <!-- Sparks flying up out of the fire -->
        <span class="ember" style="left:11%;--drift:8px;animation-delay:0.8s"></span>
        <span class="ember" style="left:8%;--drift:1px;animation-delay:0.9s"></span>
        <span class="ember" style="left:19%;--drift:10px;animation-delay:0.9s"></span>
        <span class="ember" style="left:6%;--drift:9px;animation-delay:0.0s"></span>
        <span class="ember" style="left:33%;--drift:5px;animation-delay:0.4s"></span>
        <span class="ember" style="left:21%;--drift:-3px;animation-delay:0.3s"></span>
        <span class="ember" style="left:26%;--drift:5px;animation-delay:0.8s"></span>
        <span class="ember" style="left:30%;--drift:7px;animation-delay:0.7s"></span>
        <span class="ember" style="left:16%;--drift:10px;animation-delay:0.2s"></span>
        <span class="ember" style="left:11%;--drift:10px;animation-delay:0.2s"></span>
        <span class="ember" style="left:31%;--drift:6px;animation-delay:0.6s"></span>
        <span class="ember" style="left:27%;--drift:-10px;animation-delay:1.0s"></span>
        <span class="ember" style="left:28%;--drift:-8px;animation-delay:0.2s"></span>
        <span class="ember" style="left:28%;--drift:8px;animation-delay:0.0s"></span>
        ${reactor(sword?.seed, true)}
        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">${nftTag(id)}<p class="truncate text-[13px] font-semibold text-amber-50">${itemName(sword?.seed)}</p></div>
            <p class="mt-0.5 text-[11px] text-slate-300">
                <span data-furnace-elapsed data-started="${item.startedAt}" data-cap="${cap}" class="font-mono font-semibold tabular-nums text-amber-200">—</span>
                · <span data-furnace-points data-started="${item.startedAt}" data-cap="${cap}" data-pph="${pph}" data-max="${maxPoints}" data-earned="${Number(sword?.earnedPoints ?? 0)}" data-strikes="${Number(sword?.strikes ?? 0)}" class="font-mono font-semibold tabular-nums text-white">—</span> pts
            </p>
            <div class="mt-1 h-1 overflow-hidden rounded-full bg-black/40" role="progressbar" aria-label="Time toward the 24 hour limit">
                <div data-furnace-bar data-started="${item.startedAt}" data-cap="${cap}" class="h-full w-0 bg-gradient-to-r from-red-600 via-orange-500 to-amber-300"></div>
            </div>
            <p data-furnace-full class="hidden text-[11px] font-semibold text-amber-200">Full. Take it out.</p>
            <p data-furnace-note class="hidden"></p>
        </div>
        <button type="button" onclick="takeOut('${id}')" class="${BUTTON.heat} shrink-0 px-3 py-2">Take out</button>
    </div>
    `;
};

/** Hours since the last on-chain save, for weapons with progress only on this phone */
const unsavedHours = (play, now) => (play?.unsavedSince != null ? Math.max(0, (now - Number(play.unsavedSince)) / 3600) : 0);

const ageText = (hours) => (hours >= 24 ? `${Math.floor(hours / 24)}d ${Math.floor(hours % 24)}h` : `${Math.max(1, Math.floor(hours))}h`);

const statusOf = (chainSword, play) => {
    if (BigInt(chainSword?.listPrice ?? 0) > 0n) return "listed";
    if (play?.isInFurnace) return "heating";
    return "idle";
};

const hasUnsavedOf = (play) => play?.unsaved?.strikes > 0 || play?.unsaved?.minutes > 0;

/** A weapon can be saved when it is idle, unlisted and has progress only on this phone */
const isSavable = (chainSword, play) => statusOf(chainSword, play) === "idle" && hasUnsavedOf(play);

/**
 * Compact card: one row with the weapon, value and a quick Strike; tap the row for stats,
 * unsaved progress details, and Heat / Sell / Send.
 */
const swordCard = (id, chainSword, play, hasFreeFurnace, now, feeBps) => {
    const status = statusOf(chainSword, play);
    const isListed = status === "listed";
    const isHeating = status === "heating";
    const points = Number(play?.points ?? 0);
    const value = isListed ? chainSword?.value : play?.value ?? chainSword?.value;
    const strikes = play?.strikes ?? chainSword?.strikes;
    const grade = gradeOf(play?.totalScore ?? chainSword?.totalScore, strikes);
    const heated = Number(play?.furnaceSeconds ?? Number(chainSword?.furnaceMinutes ?? 0) * 60);
    const unsaved = play?.unsaved ?? { strikes: 0, minutes: 0 };
    const hasUnsaved = !isListed && hasUnsavedOf(play);
    const hours = hasUnsaved ? unsavedHours(play, now) : 0;
    const isStale = hours >= STALE_HOURS;
    const canSave = isSavable(chainSword, play);
    const isPicked = view.selected.has(String(id));
    const isOpen = view.open.has(String(id)) && !view.isSaveMode;

    const statusBadge = isListed ? badge("Listed", "listed")
        : isHeating ? `<span class="inline-flex items-center gap-1.5 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-orange-200 ring-1 ring-inset ring-red-400/40"><span class="hot-dot"></span>Heating</span>`
        : "";
    const unsavedTag = hasUnsaved
        ? `<span class="rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${isStale ? "bg-rose-500/25 text-rose-100" : "bg-violet-500/20 text-violet-100"}">${isStale ? "!" : ""} unsaved ${ageText(hours)}</span>`
        : "";

    // Save mode: the whole card is the checkbox
    const picker = view.isSaveMode ? /*html*/`
        <button type="button" onclick="toggleSaveSelect('${id}')" ${canSave ? "" : "disabled"} aria-pressed="${isPicked}"
            aria-label="${canSave ? `Select #${id} to save` : `#${id} has nothing to save`}"
            class="absolute inset-0 z-10 flex items-center justify-end p-3 ${canSave ? "cursor-pointer" : "cursor-not-allowed bg-indigo-950/50"} ${FOCUS}">
            <span class="cut grid h-7 w-7 place-items-center font-bold ${isPicked ? "bg-amber-300 text-amber-950" : "bg-indigo-950/80 text-transparent shadow-[inset_0_0_0_1px_rgba(252,211,77,0.5)]"}">✓</span>
        </button>
    ` : "";

    // Quick action on the row itself: preventDefault keeps the tap from also toggling the card
    const quick = view.isSaveMode ? "" : isListed
        ? `<button type="button" onclick="event.preventDefault(); cancelSale('${id}')" class="${BUTTON.small}">Unlist</button>`
        : isHeating ? ""
        : `<button type="button" onclick="event.preventDefault(); openStrike('${id}')" class="${BUTTON.heat} px-3 py-1.5" ${points < 1 ? "disabled" : ""}>Strike${points > 0 ? ` ${points}` : ""}</button>`;

    const actions = isListed ? /*html*/`
        <p class="text-xs text-slate-400">Listed at ${money(chainSword?.listPrice, 2)}, ${listedFor(chainSword?.syncedAt, now)} ago. Heating and striking pause while listed.</p>
    ` : isHeating ? /*html*/`
        <p class="text-xs text-amber-200/80">In a furnace. Take it out to strike, sell or save.</p>
    ` : /*html*/`
        <div class="grid grid-cols-3 gap-2">
            <button type="button" onclick="heatSword('${id}')" class="${BUTTON.ghost} px-2" ${hasFreeFurnace ? "" : "disabled title=\"All furnaces are busy\""}>Heat</button>
            <button type="button" onclick="toggleListForm('${id}')" class="${BUTTON.ghost} px-2">Sell</button>
            <button type="button" onclick="toggleSendForm('${id}')" class="${BUTTON.ghost} px-2">Send</button>
        </div>
    `;

    return /*html*/`
    <article class="${CARD} cv-auto relative min-w-0 ${isStale ? "hud-plasma" : ""} ${view.isSaveMode && isPicked ? "ring-2 ring-inset ring-amber-300/70" : ""}">
        ${picker}
        <details ${isOpen ? "open" : ""} ontoggle="setCardOpen('${id}', this.open)">
            <summary class="flex min-w-0 items-center gap-2.5 p-2.5">
                <div class="grid h-14 w-14 shrink-0 place-items-center bg-[radial-gradient(circle,rgba(252,211,77,0.14),transparent_70%)]">${itemArt(chainSword?.seed, { glow: grade.glow, heat: isHeating ? 0.7 : 0, className: "h-14 w-14" })}</div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">${nftTag(id)}<h3 class="truncate text-[13px] font-semibold text-amber-50">${itemName(chainSword?.seed)}</h3></div>
                    <p class="mt-0.5 font-mono text-[13px] font-semibold tabular-nums text-emerald-300">${money(value, 4)}</p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-1">${statusBadge}${unsavedTag}</div>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">${quick}${view.isSaveMode ? "" : chevron}</div>
            </summary>

            <div class="flex flex-col gap-3 border-t border-amber-200/10 px-2.5 pb-3 pt-2.5">
                <div class="grid grid-cols-4 gap-2">
                    ${stat("Points", `${points.toLocaleString()}${play?.isFull ? " max" : ""}`, play?.isFull ? "text-red-300" : points > 0 ? "text-amber-200" : "text-slate-400")}
                    ${stat("Heated", formatDuration(heated))}
                    ${stat("Strikes", Number(strikes ?? 0).toLocaleString())}
                    ${stat("Grade", grade.avg ? `${grade.label} ${grade.avg.toFixed(0)}` : "—", grade.tone)}
                </div>

                ${hasUnsaved ? /*html*/`
                    <p class="text-xs ${isStale ? "text-rose-200" : "text-violet-200"}">Not saved for <span class="font-mono font-semibold">${ageText(hours)}</span>: ${unsaved.strikes} strikes and ${formatDuration(unsaved.minutes * 60)} heat are on this phone only.${isStale ? " Save soon." : ""}</p>
                ` : ""}

                ${actions}

                <!-- ฟอร์มตั้งขาย -->
                <div data-list-panel="${id}" class="hidden">
                    <label class="block text-xs text-slate-400" for="price-${id}">Price in ${TICKER}</label>
                    <div class="mt-1.5 flex gap-2">
                        <input id="price-${id}" data-list-price="${id}" type="number" inputmode="decimal" min="0" step="0.0001" value="${coins(value, 4)}" oninput="updateNet('${id}', this.value)"
                            class="cut min-w-0 flex-1 bg-indigo-950/70 px-3 py-2 font-mono text-sm tabular-nums text-white ring-1 ring-inset ring-amber-200/25 ${FOCUS}">
                        <button type="button" onclick="listForSale('${id}')" class="${BUTTON.primary}">List</button>
                    </div>
                    <p class="mt-1.5 text-[11px] text-slate-400">You get <span data-list-net="${id}" data-fee-bps="${feeBps}" class="font-mono font-semibold text-white">—</span> after ${taxText(feeBps)} tax (burned). Listing saves progress too.</p>
                </div>

                <!-- ฟอร์มส่งอาวุธ -->
                <div data-send-panel="${id}" class="hidden">
                    <label class="block text-xs text-slate-400" for="send-${id}">Send to wallet</label>
                    <div class="mt-1.5 flex gap-2">
                        <input id="send-${id}" data-send-to="${id}" type="text" autocomplete="off" spellcheck="false" placeholder="0x…"
                            class="cut min-w-0 flex-1 bg-indigo-950/70 px-3 py-2 font-mono text-sm text-white ring-1 ring-inset ring-amber-200/25 ${FOCUS}">
                        <button type="button" onclick="sendTo('${id}')" class="${BUTTON.primary}">Send</button>
                    </div>
                    <p class="mt-1.5 text-[11px] text-slate-500">Free, no tax. The progress on this phone goes with it.</p>
                </div>
            </div>
        </details>
    </article>
    `;
};

const chip = (isOn, onclick, label) => /*html*/`
    <button type="button" onclick="${onclick}" aria-pressed="${isOn}"
        class="cut shrink-0 px-3 py-1.5 text-xs font-semibold ${isOn ? "bg-amber-300/20 text-amber-100 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.6)]" : "bg-white/[0.03] text-slate-400 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.15)]"} ${FOCUS}">${label}</button>
`;

/** Re-rendered on its own (window.repaintArmory) so filters and save mode feel instant */
const armory = (data) => {
    if (!data?.wallet?.address) return connectPrompt("Connect to open your armory", "Your weapons and furnaces live in your wallet.");

    const now = Number(data?.game?.now ?? Math.floor(Date.now() / 1000));
    const ids = Array.isArray(data?.userInfo?.[0]) ? Array.from(data.userInfo[0], String) : [];
    const chainSwords = Array.isArray(data?.userInfo?.[1]) ? data.userInfo[1] : [];
    const play = data?.game?.swords ?? {};
    const furnaces = data?.game?.furnaces ?? { slots: 3, items: [] };
    const items = Array.from({ length: Number(furnaces.slots ?? 3) }, (_, i) => furnaces.items?.[i] ?? null);
    const busy = items.filter(Boolean).length;
    const hasFreeFurnace = busy < items.length;

    const rows = ids.map((id, i) => ({ id, chain: chainSwords[i], play: play[id] }));
    const swordsById = Object.fromEntries(rows.map((r) => [ r.id, { ...r.chain, ...r.play } ]));

    const savable = rows.filter((r) => isSavable(r.chain, r.play));
    const stale = savable.filter((r) => unsavedHours(r.play, now) >= STALE_HOURS);
    if (typeof window !== "undefined") window.__savableIds = savable.map((r) => r.id);
    // Drop selections that can no longer be saved (sold, listed, heated since)
    view.selected = new Set([ ...view.selected ].filter((id) => savable.some((r) => r.id === id)));

    let list = rows.filter((r) => {
        const status = statusOf(r.chain, r.play);
        if (view.status === "unsaved" && !hasUnsavedOf(r.play)) return false;
        if (view.status !== "all" && view.status !== "unsaved" && status !== view.status) return false;
        return true;
    });
    if (view.isSaveMode) list = list.filter((r) => isSavable(r.chain, r.play));

    const valueOf = (r) => BigInt(r.play?.value ?? r.chain?.value ?? 0);
    const sorters = {
        unsaved: (a, b) => (unsavedHours(b.play, now) - unsavedHours(a.play, now)) || (Number(b.id) - Number(a.id)),
        value:   (a, b) => (valueOf(a) < valueOf(b) ? 1 : valueOf(a) > valueOf(b) ? -1 : 0),
        points:  (a, b) => Number(b.play?.points ?? 0) - Number(a.play?.points ?? 0),
        newest:  (a, b) => Number(b.id) - Number(a.id),
    };
    list.sort(sorters[view.sort] ?? sorters.unsaved);
    const visible = list.slice(0, view.shown);
    const picked = view.selected.size;

    return /*html*/`
    <section class="flex flex-col gap-6 ${view.isSaveMode ? "pb-24" : ""}">
        <!-- เตาเผา -->
        <div class="flex flex-col gap-3">
            <div class="flex items-end justify-between gap-3">
                ${pageTitle("Furnaces", `${busy} of ${items.length} burning`)}
                <p class="shrink-0 text-right text-[11px] text-slate-400">${perMinuteText(data?.game?.rules?.pointsPerHour)}, 24h a charge<br>max ${Number(data?.game?.rules?.maxPoints ?? 1000).toLocaleString()} points a weapon</p>
            </div>
            <div class="grid gap-2 lg:grid-cols-3">
                ${items.map((item, i) => furnaceSlot(item, i, swordsById, data?.game?.rules)).join("")}
            </div>
        </div>

        <!-- คลังอาวุธ -->
        <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-end justify-between gap-3">
                ${pageTitle("Armory", `${ids.length.toLocaleString()} weapon${ids.length === 1 ? "" : "s"}`)}
                <div class="flex gap-2">
                    ${view.isSaveMode ? "" : `<button type="button" onclick="openPractice()" class="${BUTTON.ghost}">Practice</button>`}
                    ${view.isSaveMode
                        ? `<button type="button" onclick="exitSaveMode()" class="${BUTTON.ghost}">Cancel</button>`
                        : `<button type="button" onclick="enterSaveMode()" class="${BUTTON.primary}" ${savable.length ? "" : "disabled title=\"Nothing new to save\""}>Save${savable.length ? ` (${savable.length})` : ""}</button>`}
                </div>
            </div>

            ${stale.length && !view.isSaveMode ? /*html*/`
                <div class="${CARD} hud-plasma flex flex-wrap items-center justify-between gap-3 p-4" role="alert">
                    <p class="min-w-0 text-sm text-rose-100"><span class="font-semibold">${stale.length} weapon${stale.length === 1 ? " has" : "s have"} not been saved for over 24 hours.</span> Their progress is only on this phone.</p>
                    <button type="button" onclick="enterSaveMode(${JSON.stringify(stale.slice(0, MAX_SAVE).map((r) => r.id)).replace(/"/g, "'")})" class="${BUTTON.heat}">Save them</button>
                </div>
            ` : ""}

            ${view.isSaveMode ? /*html*/`
                <div class="cut flex flex-wrap items-center justify-between gap-3 bg-amber-300/[0.08] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.3)]">
                    <p class="text-xs text-amber-50">Tick the weapons to save. One transaction, one gas fee, up to ${MAX_SAVE} at a time.</p>
                    <label class="flex items-center gap-2 text-xs text-slate-300">
                        <input type="checkbox" class="h-4 w-4 accent-amber-400" onchange="selectAllSavable(this.checked)" ${picked && picked === Math.min(savable.length, MAX_SAVE) ? "checked" : ""}>
                        Select ${savable.length > MAX_SAVE ? `first ${MAX_SAVE}` : "all"}
                    </label>
                </div>
            ` : /*html*/`
                <details class="${CARD} px-3 py-2" ${view.status !== "all" || view.sort !== "unsaved" ? "open" : ""}>
                <summary class="flex items-center justify-between gap-2 text-[13px] text-slate-300">
                    <span>Filter & sort <span class="text-slate-500">${STATUSES.find((x) => x.id === view.status)?.label ?? ""}</span></span>${chevron}
                </summary>
                <div class="mt-2 flex flex-col gap-2">
                    <div class="-mx-3 flex gap-1.5 overflow-x-auto px-3">
                        ${STATUSES.map((s) => chip(view.status === s.id, `setArmoryStatus('${s.id}')`, s.label)).join("")}
                    </div>
                    <label class="sr-only" for="armory-sort">Sort</label>
                    <select id="armory-sort" onchange="setArmorySort(this.value)" class="cut bg-indigo-950/70 px-3 py-2 text-sm text-white ring-1 ring-inset ring-amber-200/25 ${FOCUS}">
                        ${SORTS.map((s) => `<option value="${s.id}" ${s.id === view.sort ? "selected" : ""}>${s.label}</option>`).join("")}
                    </select>
                    <p class="text-xs text-slate-500">Every weapon is an NFT you can sell anywhere. Other marketplaces only see what is saved on-chain, so save before listing there.</p>
                </div>
                </details>
            `}

            ${ids.length === 0 ? /*html*/`
                <div class="${CARD} flex flex-wrap items-center justify-between gap-3 p-5">
                    <p class="text-sm text-slate-400">No weapons yet. Mint one from the supply drop, or buy one in the market.</p>
                    <button type="button" onclick="switchTab('mint')" class="${BUTTON.primary}">Go to mint</button>
                </div>
            ` : list.length === 0 ? /*html*/`
                <div class="${CARD} p-5 text-sm text-slate-400">${view.isSaveMode ? "Nothing to save right now." : "No weapons match. Try another filter."}</div>
            ` : /*html*/`
                <p class="text-xs text-slate-500">Showing ${visible.length.toLocaleString()} of ${list.length.toLocaleString()}</p>
                <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    ${visible.map((r) => swordCard(r.id, r.chain, r.play, hasFreeFurnace, now, data?.feeBps)).join("")}
                </div>
                ${visible.length < list.length ? `<button type="button" onclick="showMoreArmory()" class="${BUTTON.ghost} mx-auto w-full sm:w-auto">Show ${Math.min(PAGE, list.length - visible.length)} more</button>` : ""}
            `}
        </div>

        ${view.isSaveMode ? /*html*/`
            <!-- แถบยืนยันการเซฟ -->
            <div class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 px-4 sm:bottom-6">
                <div class="${CARD} mx-auto flex w-full max-w-xl items-center justify-between gap-3 p-3">
                    <p class="text-sm text-slate-200"><span class="font-mono font-semibold text-cyan-200">${picked}</span> selected${picked > MAX_SAVE ? `, max ${MAX_SAVE}` : ""}</p>
                    <button type="button" onclick="confirmSave()" class="${BUTTON.primary}" ${picked && picked <= MAX_SAVE ? "" : "disabled"}>Confirm save</button>
                </div>
            </div>
        ` : ""}
    </section>
    `;
};

/** Weapons ticked in save mode */
const selectedForSave = () => [ ...view.selected ];

export { armory, selectedForSave };
