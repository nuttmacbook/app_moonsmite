import { CARD, chevron, taxText } from "./ui";

const RULES = [
    { part: "Time",    rate: "4%",     note: "Every strike counts. Strike points come from heat in the furnace." },
    { part: "Value",   rate: "0–4%",   note: "Grows with the weapon's value, full at 5,000 MWLD and above." },
    { part: "Skill",   rate: "0–6%",   note: "Each strike's quality out of 100." },
];

const footer = (data) => /*html*/`
    <footer class="mt-6 w-full">
        <details class="${CARD}">
            <summary class="flex items-center justify-between gap-3 p-4">
                <div class="min-w-0">
                    <h2 class="font-display text-sm font-semibold uppercase tracking-wider text-amber-50">How value grows</h2>
                    <p class="text-xs text-slate-400">Up to 14% a month for a weapon struck every day</p>
                </div>
                ${chevron}
            </summary>
            <div class="flex flex-col gap-2 border-t border-amber-200/10 p-4">
                ${RULES.map((r) => /*html*/`
                    <div class="flex items-baseline justify-between gap-3">
                        <p class="text-sm text-slate-200">${r.part} <span class="block text-xs text-slate-400">${r.note}</span></p>
                        <p class="shrink-0 font-mono text-sm font-semibold tabular-nums text-amber-200">${r.rate}</p>
                    </div>
                `).join("")}
                <p class="mt-1 text-xs text-slate-500">Rates are per month, spread over a month of strike points. A furnace stops counting after 24 hours, so come back daily. Marketplace sales carry a ${taxText(data?.feeBps)} tax that is burned.</p>
            </div>
        </details>
    </footer>
`;

export { footer };
