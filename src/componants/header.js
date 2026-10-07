import { shortAddress } from "../web3/connect";
import { BUTTON, FOCUS, CARD, money } from "./ui";

const ICONS = {
    mint:    `<path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8m0-11.4-2.8 2.8m-5.8 5.8-2.8 2.8" stroke-linecap="round"/>`,
    market:  `<path d="M4 9h16l-1.5-5h-13L4 9Zm0 0v10h16V9M9 19v-5h6v5" stroke-linejoin="round"/>`,
    armory:  `<path d="M5 19 16 8m2-4 2 2-3 3-2-2 3-3ZM4 16l4 4" stroke-linecap="round" stroke-linejoin="round"/>`,
    moon:    `<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" stroke-linejoin="round"/>`,
    profile: `<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke-linecap="round"/>`,
};

const TABS = [
    { id: "mint",    label: "Mint" },
    { id: "market",  label: "Market" },
    { id: "armory",  label: "Armory" },
    { id: "profile", label: "Profile" },
];

/** Wallet popup: address, balance, profile, and Disconnect — works before the first mint too */
if (typeof window !== "undefined") {
    window.openWalletMenu = (address, balanceWei) => {
        const el = document.querySelector("#sheet-root");
        if (!el) return;
        const close = () => (el.innerHTML = "");
        window.closeWalletMenu = close;
        el.innerHTML = /*html*/`
            <div class="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/70 backdrop-blur-sm sm:items-start sm:justify-end sm:p-4" data-backdrop onclick="if (event.target === this) closeWalletMenu()">
                <div class="${CARD} w-full max-w-sm p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:mt-14" role="dialog" aria-modal="true" aria-labelledby="wallet-menu-title">
                    <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-amber-200/30 sm:hidden"></div>
                    <p id="wallet-menu-title" class="text-[11px] uppercase tracking-wider text-slate-400">Connected wallet</p>
                    <p class="mt-1 break-all font-mono text-[13px] text-amber-50">${address}</p>
                    <p class="mt-3 font-mono text-lg font-semibold tabular-nums text-white">${money(balanceWei, 2)}</p>
                    <div class="mt-4 grid grid-cols-2 gap-2">
                        <button type="button" onclick="copyText('${address}', 'Address copied')" class="${BUTTON.ghost}">Copy</button>
                        <button type="button" onclick="closeWalletMenu(); switchTab('profile')" class="${BUTTON.ghost}">Profile</button>
                        <button type="button" onclick="closeWalletMenu(); disconnect()" class="${BUTTON.heat} col-span-2">Disconnect</button>
                    </div>
                </div>
            </div>
        `;
    };
}

const icon = (id, cls = "h-5 w-5") => `<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${ICONS[id]}</svg>`;

const header = (data) => {
    const isConnected = Boolean(data?.wallet?.address);
    const tab = data?.tab ?? "mint";

    return /*html*/`
    <header class="sticky top-0 z-30 border-b border-amber-200/15 bg-indigo-950/70 backdrop-blur">
        <div class="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <!-- Brand -->
            <a href="#" onclick="switchTab('mint'); return false;" class="flex shrink-0 items-center gap-2 rounded-lg ${FOCUS}">
                <img src="https://www.moonworld.app/logo.png" alt="" width="32" height="32" class="h-8 w-8 rounded-full object-contain drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]">
                <span class="bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 bg-clip-text font-display text-[15px] font-bold uppercase tracking-[0.18em] text-transparent drop-shadow-[0_1px_0_rgba(120,53,15,0.8)]">Moon Smith</span>
            </a>

            <!-- Tabs: desktop only, phones use the bottom bar -->
            <nav class="hidden gap-1 sm:flex" role="tablist" aria-label="Sections">
                ${TABS.map((t) => /*html*/`
                    <button type="button" role="tab" data-tab-button="${t.id}" aria-selected="${t.id === tab}" onclick="switchTab('${t.id}')"
                        class="cut px-3 py-1.5 font-display text-[12px] font-semibold uppercase tracking-wider text-slate-300 transition hover:text-white aria-selected:bg-amber-300/15 aria-selected:text-amber-200 ${FOCUS}">${t.label}</button>
                `).join("")}
            </nav>

            <!-- Wallet -->
            <div class="ml-auto flex min-w-0 items-center">
                ${isConnected ? /*html*/`
                    <button type="button" onclick="openWalletMenu('${data.wallet.address}', '${data?.balance ?? 0}')" aria-label="Wallet menu"
                        class="cut flex min-w-0 items-center gap-2 bg-white/[0.06] py-1.5 pl-2.5 pr-2 text-right shadow-[inset_0_0_0_1px_rgba(252,211,77,0.3)] hover:bg-white/10 ${FOCUS}">
                        <span class="min-w-0">
                            <span class="block truncate font-mono text-[13px] font-semibold tabular-nums text-amber-50">${money(data?.balance, 2)}</span>
                            <span class="block truncate font-mono text-[10px] text-slate-400">${shortAddress(data.wallet.address)}</span>
                        </span>
                    </button>
                ` : /*html*/`
                    <button type="button" onclick="connectWallet()" class="${BUTTON.primary}">Connect wallet</button>
                `}
            </div>
        </div>
    </header>
    `;
};

/** Phone navigation, thumb reachable, clears the home indicator */
const bottomNav = (data) => {
    const tab = data?.tab ?? "mint";
    return /*html*/`
    <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200/20 bg-indigo-950/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-12px_40px_-20px_rgba(252,211,77,0.35)] backdrop-blur sm:hidden" role="tablist" aria-label="Sections">
        <div class="grid grid-cols-4">
            ${TABS.map((t) => /*html*/`
                <button type="button" role="tab" data-tab-button="${t.id}" data-tab-style="bar" aria-selected="${t.id === tab}" onclick="switchTab('${t.id}')"
                    class="flex flex-col items-center gap-0.5 py-2 font-display text-[10px] font-semibold uppercase tracking-wider text-slate-400 aria-selected:text-amber-200 aria-selected:drop-shadow-[0_0_8px_rgba(252,211,77,0.7)] ${FOCUS}">
                    ${icon(t.id)}
                    ${t.label}
                </button>
            `).join("")}
        </div>
    </nav>
    `;
};

export { header, bottomNav };
