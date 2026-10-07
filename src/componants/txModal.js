import { BUTTON } from "./ui";

// Lives in its own root so a page repaint never wipes a transaction in progress

const STAGES = {
    checking:  { title: "Checking your wallet",     desc: "Making sure you have enough MWLD before anything is signed." },
    signing:   { title: "Preparing progress",       desc: "Packing this weapon's progress from your phone for the chain." },
    approve:   { title: "Approve MWLD",             desc: "Allow the game contract to take this payment. Confirm in your wallet." },
    approving: { title: "Waiting for approval",     desc: "The approval is being confirmed on chain." },
    create:    { title: "Confirm in your wallet",   desc: "Check the details and confirm the transaction." },
    creating:  { title: "Waiting for confirmation", desc: "Your transaction is on its way. This takes a few seconds." },
};

let closeTimer;

const root = () => document.querySelector("#tx-root");

const shell = (inner) => /*html*/`
    <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" data-backdrop>
        <div class="hud w-full max-w-sm p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]" role="dialog" aria-modal="true" aria-live="polite">
            ${inner}
        </div>
    </div>
`;

const close = () => {
    clearTimeout(closeTimer);
    const el = root();
    if (el) el.innerHTML = "";
};

const notify = {
    pending: ({ stage = "checking", index = 0, total = 1 } = {}) => {
        clearTimeout(closeTimer);
        const step = STAGES[stage] ?? STAGES.checking;
        const el = root();
        if (!el) return;
        el.innerHTML = shell(/*html*/`
            <div class="flex items-start gap-3">
                <span class="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300 motion-reduce:animate-none" aria-hidden="true"></span>
                <div class="min-w-0">
                    <p class="font-semibold text-white">${step.title}</p>
                    <p class="mt-1 text-sm text-slate-400">${step.desc}</p>
                    ${total > 1 && index > 0 ? `<p class="mt-3 font-mono text-xs tabular-nums text-slate-500">Step ${index} of ${total}</p>` : ""}
                </div>
            </div>
        `);
    },

    success: ({ title = "Done", desc = "", hash } = {}) => {
        const el = root();
        if (!el) return;
        el.innerHTML = shell(/*html*/`
            <div class="flex items-start gap-3">
                <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300" aria-hidden="true">✓</span>
                <div class="min-w-0">
                    <p class="font-semibold text-white">${title}</p>
                    ${desc ? `<p class="mt-1 text-sm text-slate-400">${desc}</p>` : ""}
                    ${hash ? `<p class="mt-2 truncate font-mono text-[11px] text-slate-500">${hash}</p>` : ""}
                </div>
            </div>
        `);
        closeTimer = setTimeout(close, 1600);
    },

    error: (error) => {
        const isRejected = error?.code === "ACTION_REJECTED" || error?.code === 4001;
        const el = root();
        if (!el) return;
        el.innerHTML = shell(/*html*/`
            <div class="flex items-start gap-3">
                <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-500/20 text-rose-300" aria-hidden="true">!</span>
                <div class="min-w-0">
                    <p class="font-semibold text-white">${isRejected ? "You cancelled it" : "That did not go through"}</p>
                    <p class="mt-1 break-words text-sm text-slate-400">${isRejected ? "Nothing was sent. Try again when you are ready." : error?.message ?? "Something went wrong. Please try again."}</p>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button type="button" onclick="closeNotify()" class="${BUTTON.ghost}">Close</button>
            </div>
        `);
    },

    close,
};

if (typeof window !== "undefined") {
    window.closeNotify = close;
}

export { notify };
