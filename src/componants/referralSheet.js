import { BUTTON, FOCUS } from "./ui";

// Asked once, on the wallet's first purchase. The contract checks the referrer is a registered player.

/**
 * @param {{ initial?: string, resolve: (ref: string) => Promise<{ address?: string, error?: string }> }} options
 *        resolve turns a player id or address into the referrer's address, or explains what is wrong
 * @returns {Promise<string|null>} referrer address, null when the player closes the sheet
 */
const askReferrer = ({ initial = "", resolve: lookup }) => new Promise((resolve) => {
    const el = document.querySelector("#sheet-root");
    if (!el) return resolve(null);

    const done = (address) => {
        el.innerHTML = "";
        resolve(address);
    };

    el.innerHTML = /*html*/`
        <div class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm sm:items-center sm:p-4" data-backdrop>
            <form data-ref-form class="hud w-full max-w-sm p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] " role="dialog" aria-modal="true" aria-labelledby="ref-title">
                <div class="mx-auto mb-4 h-0.5 w-10 bg-cyan-300/40 sm:hidden"></div>
                <h2 id="ref-title" class="font-display text-base font-semibold uppercase tracking-wide text-white">Who invited you?</h2>
                <p class="mt-1 text-sm text-slate-400">Your first mint needs the player who invited you. Enter their player ID or paste their invite link. This is saved once and cannot be changed.</p>
                <label for="ref-input" class="sr-only">Referrer wallet or link</label>
                <input id="ref-input" data-ref-input type="text" autocomplete="off" spellcheck="false" value="${initial}" placeholder="Player ID, e.g. 42, or invite link"
                    class="cut mt-4 w-full bg-indigo-950 px-3 py-2.5 font-mono text-sm text-white ring-1 ring-inset ring-amber-200/30 placeholder:text-slate-500 ${FOCUS}" disabled>
                <p data-ref-error class="mt-2 hidden text-sm text-rose-300" role="alert"></p>
                <div class="mt-4 flex gap-2">
                    <button type="submit" data-ref-submit class="${BUTTON.primary} flex-1">Continue</button>
                    <button type="button" data-ref-cancel class="${BUTTON.ghost}">Cancel</button>
                </div>
            </form>
        </div>
    `;

    const input = el.querySelector("[data-ref-input]");
    const error = el.querySelector("[data-ref-error]");
    const submit = el.querySelector("[data-ref-submit]");

    // Accepts a player id ("42"), a link with ?ref=42, or an address / older ?ref=0x… link
    const parse = (text) => {
        const t = String(text ?? "").trim();
        const address = t.match(/0x[a-fA-F0-9]{40}/);
        if (address) return address[0].toLowerCase();
        const id = t.match(/[?&]ref=(\d+)/) ?? t.match(/^#?(\d+)$/);
        return id ? id[1] : "";
    };

    el.querySelector("[data-ref-form]").addEventListener("submit", async (e) => {
        e.preventDefault();
        const ref = parse(input.value);
        const out = ref ? await lookup(ref) : { error: "Enter a player ID or paste an invite link." };
        if (!out?.address) {
            error.textContent = out?.error ?? "That invite did not work.";
            error.classList.remove("hidden");
            return;
        }
        submit.disabled = true;
        done(out.address);
    });
    el.querySelector("[data-ref-cancel]").addEventListener("click", () => done(null));
    el.querySelector("[data-backdrop]").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) done(null);
    });
    input.focus();
});

export { askReferrer };
