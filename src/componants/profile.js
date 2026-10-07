import { shortAddress } from "../web3/connect";
import { CARD, BUTTON, coins, money, chevron, taxText, stat, nftTag, timeAgo, connectPrompt, pageTitle } from "./ui";

const ZERO = "0x0000000000000000000000000000000000000000";

const GAME_NAMES = { ring: "Strike", hammer: "Strike", temper: "Temper", runes: "Runes", fractures: "Fractures" };

const BUCKETS = [
    { id: "perfect",  label: "Perfect", range: "95–100", bar: "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" },
    { id: "clean",    label: "Clean",   range: "75–94",  bar: "bg-sky-300" },
    { id: "rough",    label: "Rough",   range: "40–74",  bar: "bg-violet-500" },
    { id: "glancing", label: "Glancing", range: "0–39",  bar: "bg-slate-600" },
];

const MAX_GUILD_LEVELS = 30;

const percent = (bps) => `${(Number(bps) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;

/** Members, share, unlock state and income at each guild level, plus the claim box */
const guildCard = (data, account) => {
    const rates = Array.from(data?.guild?.[0] ?? [], (r) => BigInt(r ?? 0));
    const unlocks = Array.from(data?.guild?.[1] ?? [], (r) => BigInt(r ?? 0));
    const members = Array.from({ length: MAX_GUILD_LEVELS }, (_, i) => BigInt(data?.guild?.[2]?.[i] ?? 0));
    const income = Array.from({ length: MAX_GUILD_LEVELS }, (_, i) => BigInt(data?.guild?.[3]?.[i] ?? 0));
    const direct = BigInt(account?.referrals ?? 0);
    const totalMembers = members.reduce((a, b) => a + b, 0n);
    const earned = BigInt(account?.referralEarned ?? 0);
    const claimed = BigInt(account?.referralClaimed ?? 0);
    const claimable = earned - claimed;
    const pool = BigInt(data?.referralPool ?? 0);

    const isOpen = (i) => i < rates.length && direct >= (unlocks[i] ?? 0n);
    const openCount = rates.filter((_, i) => isOpen(i)).length;
    // Next level still locked, and how many more direct invites it takes
    const next = rates.findIndex((_, i) => !isOpen(i));
    const needMore = next >= 0 ? unlocks[next] - direct : 0n;
    const openThrough = next >= 0 ? rates.findLastIndex((_, i) => unlocks[i] === unlocks[next]) : -1;

    // Every level that pays, plus any older level that still has members or income
    const lastUsed = members.reduce((d, n, i) => (n > 0n || income[i] > 0n ? i + 1 : d), 0);
    const shown = Math.max(rates.length, lastUsed);

    return /*html*/`
    <details class="${CARD} group">
        <summary class="flex items-center justify-between gap-3 p-4">
            <div class="min-w-0">
                <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">Guild</h2>
                <p class="text-xs text-slate-400">${totalMembers.toLocaleString()} members · ${openCount} of ${rates.length} levels open · ready ${coins(claimable, 2)}</p>
            </div>
            ${chevron}
        </summary>
    <div class="flex flex-col gap-4 border-t border-amber-200/10 p-4">
        <p class="text-xs text-slate-400">Everyone who joined through you, and through them. When a member sells a weapon, you earn a share of the real value they grew on it, on every level you have unlocked. Invite players directly to unlock deeper levels.</p>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            ${stat("Direct invites", direct.toLocaleString(), "text-amber-200")}
            ${stat("Levels open", `${openCount} of ${rates.length}`, openCount ? "text-fuchsia-200" : "text-slate-400")}
            ${stat("Members", totalMembers.toLocaleString())}
            ${stat("Guild income", coins(earned, 2), "text-emerald-300")}
        </div>

        ${next >= 0 ? /*html*/`
            <p class="cut bg-violet-500/15 px-3 py-2 text-xs text-violet-100 shadow-[inset_0_0_0_1px_rgba(196,181,253,0.35)]">
                Invite <span class="font-mono font-semibold">${needMore.toLocaleString()}</span> more player${needMore === 1n ? "" : "s"} directly to unlock
                ${openThrough > next ? `levels ${next + 1}–${openThrough + 1}` : `level ${next + 1}`}.
            </p>
        ` : ""}

        <div class="grid grid-cols-2 gap-3">
            ${stat("Claimed", coins(claimed, 2))}
            ${stat("Ready", coins(claimable, 2), claimable > 0n ? "text-cyan-200" : "text-slate-400")}
        </div>
        <div class="flex items-center justify-between gap-3">
            <p class="text-[11px] text-slate-500">${claimable > 0n && pool < claimable ? "The guild pool is being topped up. Try again later." : "Paid from the game's guild pool."}</p>
            <button type="button" onclick="claimReferralIncome()" class="${BUTTON.primary} shrink-0" ${claimable > 0n && pool >= claimable ? "" : "disabled"}>Claim</button>
        </div>

        <!-- รายชั้น -->
        <details class="overflow-hidden ring-1 ring-inset ring-amber-200/15">
            <summary class="flex items-center justify-between gap-2 bg-white/[0.03] px-3 py-2 text-[13px] text-slate-200"><span>Members and income by level</span>${chevron}</summary>
            <div class="grid grid-cols-[5.5rem_3rem_1fr_1fr] gap-2 border-t border-amber-200/10 px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500">
                <span>Level</span><span class="text-right">Share</span><span class="text-right">Members</span><span class="text-right">Income</span>
            </div>
            <ul class="divide-y divide-amber-200/10">
                ${Array.from({ length: shown }, (_, i) => {
                    const inPlay = i < rates.length;
                    const open = isOpen(i);
                    return /*html*/`
                    <li class="grid grid-cols-[5.5rem_3rem_1fr_1fr] items-center gap-2 px-3 py-2">
                        <span class="min-w-0">
                            <span class="block font-mono text-xs text-slate-200">L${i + 1}${i === 0 ? ` <span class="text-slate-500">direct</span>` : ""}</span>
                            <span class="block font-mono text-[10px] ${open ? "text-emerald-300" : "text-slate-500"}">${!inPlay ? "off" : open ? "✓ open" : `🔒 ${unlocks[i].toLocaleString()} invites`}</span>
                        </span>
                        <span class="text-right font-mono text-xs tabular-nums ${open && rates[i] > 0n ? "text-fuchsia-200" : "text-slate-500"}">${inPlay ? percent(rates[i]) : "—"}</span>
                        <span class="text-right font-mono text-sm tabular-nums ${members[i] > 0n ? "text-white" : "text-slate-600"}">${members[i].toLocaleString()}</span>
                        <span class="text-right font-mono text-sm tabular-nums ${income[i] > 0n ? "text-emerald-300" : "text-slate-600"}">${coins(income[i], 2)}</span>
                    </li>
                    `;
                }).join("")}
            </ul>
        </details>
    </div>
    </details>
    `;
};

/** One collapsible section; summary shows the key number so most players never need to open it */
const section = (title, summary, body, isOpen = false) => /*html*/`
    <details class="${CARD}" ${isOpen ? "open" : ""}>
        <summary class="flex items-center justify-between gap-3 p-4">
            <div class="min-w-0">
                <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">${title}</h2>
                <p class="truncate text-xs text-slate-400">${summary}</p>
            </div>
            ${chevron}
        </summary>
        <div class="border-t border-amber-200/10 p-4">${body}</div>
    </details>
`;

const profile = (data) => {
    if (!data?.wallet?.address) return connectPrompt("Connect to see your profile", "Your invite link, earnings and strike record show up here.");

    // Minting is sign-up: no game ID yet, nothing to show (Disconnect lives in the wallet menu)
    if (!data?.accountInfo?.[1]) {
        return /*html*/`
        <div class="${CARD} flex flex-col items-start gap-3 p-5">
            <div>
                <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">No game ID yet</h2>
                <p class="mt-1 text-sm text-slate-400">Mint your first weapon to create your player ID. Your profile, invite link and strike record open after that.</p>
            </div>
            <button type="button" onclick="switchTab('mint')" class="${BUTTON.primary}">Go to mint</button>
        </div>
        `;
    }

    const account = data?.accountInfo?.[0] ?? {};
    const referrer = String(account?.referrer ?? ZERO);
    const stats = data?.profile?.stats ?? {};
    const recent = Array.isArray(stats?.recent) ? stats.recent : [];
    const count = Number(stats?.count ?? 0);
    const avg = count ? Number(stats?.totalScore ?? 0) / count : 0;
    const now = Number(data?.game?.now ?? 0);
    const profit = BigInt(account?.earned ?? 0) - BigInt(account?.spent ?? 0);
    const playerId = String(data?.playerId ?? "0");

    return /*html*/`
    <section class="flex flex-col gap-3">
        <div class="flex items-end justify-between gap-3">
            ${pageTitle("Pilot profile", playerId !== "0" ? `Player #${playerId}` : "Your smithy")}
            <button type="button" onclick="openWalletMenu('${data.wallet.address}', '${data?.balance ?? 0}')" class="${BUTTON.small}">Wallet</button>
        </div>

        <!-- ลิงก์ชวนเพื่อน -->
        <div class="${CARD} flex flex-col gap-2 p-4">
            <div class="flex items-center justify-between gap-3">
                <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">Invite friends</h2>
                <span class="text-xs text-slate-400">${Number(account?.referrals ?? 0)} invited</span>
            </div>
            <div class="flex min-w-0 gap-2">
                <p class="cut min-w-0 flex-1 truncate bg-indigo-950/70 px-3 py-2 font-mono text-xs text-amber-100 ring-1 ring-inset ring-amber-200/20">${data?.refLink ?? ""}</p>
                <button type="button" onclick="copyText('${data?.refLink ?? ""}', 'Link copied')" class="${BUTTON.primary} shrink-0 px-3 py-1.5">Copy</button>
            </div>
            <p class="text-[11px] text-slate-500">Friends can also type your player ID, <span class="font-mono text-amber-200">${playerId}</span>, when they mint.</p>
        </div>

        ${guildCard(data, account)}

        ${section("Trading", `Profit ${profit < 0n ? "-" : ""}${coins(profit < 0n ? -profit : profit, 2)} · tax paid ${coins(account?.taxPaid, 2)}`, /*html*/`
            <div class="grid grid-cols-3 gap-3">
                ${stat("Spent", money(account?.spent, 2))}
                ${stat("Earned", money(account?.earned, 2), "text-emerald-300")}
                ${stat("Tax paid", money(account?.taxPaid, 2), "text-rose-300")}
            </div>
            <div class="mt-3 flex items-baseline justify-between gap-3">
                <p class="text-xs text-slate-400">Value grown and sold<span class="block text-[11px] text-slate-500">What your guild is paid on</span></p>
                <p class="font-mono text-sm font-semibold tabular-nums text-emerald-300">${money(account?.guildProfit, 2)}</p>
            </div>
            <p class="mt-3 text-xs text-slate-500">${Number(account?.minted ?? 0)} minted, ${Number(account?.bought ?? 0)} bought, ${Number(account?.sold ?? 0)} sold. Profit is earned minus spent; tax is the ${taxText(data?.feeBps)} burned from your sales. Your guild is paid only on value you grew by striking, never on a higher sale price.</p>
        `)}

        ${section("Strike record", count ? `${count.toLocaleString()} strikes · average ${avg.toFixed(1)}` : "No strikes yet", /*html*/`
            <div class="grid grid-cols-3 gap-3">
                ${stat("Strikes", count.toLocaleString())}
                ${stat("Avg quality", count ? avg.toFixed(1) : "—", "text-amber-200")}
                ${stat("Value added", `+${(Number(stats?.valueAdded ?? 0) / 1e18).toFixed(4)}`, "text-emerald-300")}
            </div>
            <div class="mt-3 flex flex-col gap-2">
                ${BUCKETS.map((b) => {
                    const n = Number(stats?.[b.id] ?? 0);
                    const pct = count ? (n / count) * 100 : 0;
                    return /*html*/`
                    <div class="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-xs">
                        <span class="text-slate-300">${b.label} <span class="text-slate-600">${b.range}</span></span>
                        <span class="h-1.5 overflow-hidden rounded-full bg-indigo-950"><span class="block h-full ${b.bar}" style="width:${pct.toFixed(1)}%"></span></span>
                        <span class="text-right font-mono tabular-nums text-slate-400">${n.toLocaleString()}</span>
                    </div>
                    `;
                }).join("")}
            </div>
            ${recent.length ? /*html*/`
                <h3 class="mt-4 text-[11px] uppercase tracking-wider text-slate-500">Recent strikes</h3>
                <ul class="mt-1 divide-y divide-amber-200/10">
                    ${recent.map((r) => /*html*/`
                        <li class="flex min-w-0 items-center justify-between gap-3 py-2">
                            <div class="flex min-w-0 items-center gap-2">${nftTag(r?.tokenId)}<span class="text-[11px] text-slate-500">${timeAgo(now - Number(r?.at ?? now))}</span></div>
                            <div class="shrink-0 text-right font-mono text-xs tabular-nums">
                                <span class="${Number(r?.score) >= 95 ? "text-amber-200" : "text-white"}">${Number(r?.score ?? 0)}</span>
                                <span class="ml-2 text-emerald-300">+${(Number(r?.increase ?? 0) / 1e18).toFixed(6)}</span>
                            </div>
                        </li>
                    `).join("")}
                </ul>
            ` : ""}
        `)}

        ${section("Wallet", shortAddress(data.wallet.address), /*html*/`
            <p class="text-[11px] text-slate-500">Your address</p>
            <p class="break-all font-mono text-[13px] text-amber-50">${data.wallet.address}</p>
            <p class="mt-3 text-[11px] text-slate-500">Invited by</p>
            <p class="break-all font-mono text-[13px] text-slate-200">${referrer !== ZERO ? referrer : "You are the root account"}</p>
            <button type="button" onclick="disconnect()" class="${BUTTON.ghost} mt-4">Disconnect wallet</button>
        `)}
    </section>
    `;
};

export { profile };
