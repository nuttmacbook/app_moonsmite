import { rng, countdown, announce, buzz, average, chips, forgeSparks, shake } from "./kit";

// Rune memory: 12 runes light up around the weapon one by one, clockwise from 12 o'clock, each
// red or green. Once all 12 are up they turn blue and a fireball burns behind each. The middle
// asks for one color; tap every rune that was that color before the timer runs out.
// Right taps explode the rune; wrong taps show its real color. Then the rest drift into the
// weapon and the round is graded Perfect / Great / Bad / Miss.
// The level sets how fast the 12 runes appear. Settings: MINIGAME.rune and MINIGAME.levels.

const COUNT = 12;

// Simple angular rune glyphs (24x24, stroked), so they draw the same on every phone
const GLYPHS = [
    "M9 4v16M9 7l7-3M9 12l7-3",
    "M8 20V4l9 5v11",
    "M9 4v16M9 8l6 4-6 4",
    "M9 4v16M9 7l7 3M9 12l7 3",
    "M8 20V4l8 4-8 4 8 8",
    "M16 5l-8 7 8 7",
    "M6 4l12 16M18 4L6 20",
    "M8 20V4l8 4-8 4",
    "M7 4v16M17 4v16M7 9l10 6",
    "M12 4v16M8 9l8 6",
    "M12 4v16M8 4h8M8 20h8",
    "M10 5l-4 5 4 5M14 9l4 5-4 5",
];

const COLOR = {
    red:   { label: "Red",   rune: "bg-red-500/30 text-red-100 ring-red-400 shadow-[0_0_14px_rgba(248,113,113,0.9)]", text: "text-red-300" },
    green: { label: "Green", rune: "bg-emerald-500/30 text-emerald-100 ring-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]", text: "text-emerald-300" },
    blue:  { rune: "bg-sky-500/30 text-sky-100 ring-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.9)]" },
};

const grade = (score) => (score >= 100 ? "Perfect" : score >= 70 ? "Great" : score >= 30 ? "Bad" : "Miss");

/**
 * @param {HTMLElement} el
 * @param {object} roll  from the strike: difficulty, runeSec, seed, rune (settings), image
 * @param {(score: number) => void} onDone  average score 0-100
 */
const mountRune = (el, roll = {}, onDone) => {
    const cfg = roll.rune ?? {};
    const rounds = Number(cfg.rounds ?? 3);
    const answerMs = Number(cfg.answerSec ?? 2.0) * 1000;
    const revealMs = Math.max(0.2, Number(roll.runeSec ?? 2.0)) * 1000;
    const minTarget = Math.max(1, Number(cfg.minTarget ?? 2));
    const maxTarget = Math.min(COUNT - 1, Number(cfg.maxTarget ?? 10));
    const rand = rng(roll.seed);
    const image = roll.image ?? "";

    const scores = [];
    let isDone = false;
    let isAnswering = false;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(() => !isDone && fn(), ms));

    el.innerHTML = /*html*/`
        <div class="flex flex-col gap-3">
            <div data-stage class="stage relative h-72 touch-none select-none overflow-hidden">
                <div data-weapon class="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2">
                    ${image ? `<img src="${image}" alt="" width="512" height="512" draggable="false" class="h-full w-full select-none object-contain opacity-90">` : ""}
                </div>
                <div data-runes class="absolute inset-0"></div>
                <div data-prompt class="pointer-events-none absolute inset-0 z-[6] hidden place-items-center"></div>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-black/40">
                <div data-timer class="h-full w-full origin-left rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400" style="transform:scaleX(0)"></div>
            </div>
            <div data-chips class="flex gap-1.5">${chips(rounds, scores)}</div>
        </div>
    `;

    const stage = el.querySelector("[data-stage]");
    const layer = el.querySelector("[data-runes]");
    const prompt = el.querySelector("[data-prompt]");
    const timerBar = el.querySelector("[data-timer]");
    const panel = el.closest("[data-strike-panel]") ?? stage;

    /** Clock positions around the weapon, 12 o'clock first */
    const spots = () => {
        const box = stage.getBoundingClientRect();
        const r = Math.min(box.width, box.height) / 2 - 26;
        return Array.from({ length: COUNT }, (_, i) => {
            const a = (-90 + i * 30) * (Math.PI / 180);
            return { x: box.width / 2 + Math.cos(a) * r, y: box.height / 2 + Math.sin(a) * r };
        });
    };

    /** 12 colors with the asked color appearing minTarget..maxTarget times */
    const dealColors = (want) => {
        for (let tries = 0; tries < 50; tries++) {
            const colors = Array.from({ length: COUNT }, () => (rand() < 0.5 ? "red" : "green"));
            const n = colors.filter((c) => c === want).length;
            if (n >= minTarget && n <= maxTarget) return colors;
        }
        return Array.from({ length: COUNT }, (_, i) => (i % 2 ? "red" : want));
    };

    const playRound = () => {
        const want = rand() < 0.5 ? "red" : "green";
        const colors = dealColors(want);
        const total = colors.filter((c) => c === want).length;
        let right = 0;
        let wrong = 0;
        layer.innerHTML = "";
        prompt.classList.add("hidden");
        prompt.classList.remove("grid");
        timerBar.style.transform = "scaleX(0)";

        const pos = spots();
        const runes = colors.map((color, i) => {
            const wrap = document.createElement("div");
            wrap.className = "absolute";
            // Centered with an inline transform (the burst and drift animations build on it)
            wrap.style.cssText = `left:${pos[i].x}px;top:${pos[i].y}px;transform:translate(-50%,-50%);`;
            wrap.innerHTML = /*html*/`
                <span data-fireball class="pointer-events-none absolute left-1/2 top-1/2 hidden h-14 w-14 rounded-full"
                    style="transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(224,242,254,0.9),rgba(56,189,248,0.6) 35%,rgba(29,78,216,0.25) 60%,transparent 72%);filter:blur(2px);mix-blend-mode:screen;"></span>
                <button type="button" data-rune="${i}" aria-label="Rune ${i + 1}" disabled
                    class="relative grid h-10 w-10 place-items-center rounded-lg opacity-0 ring-2 ring-inset ${COLOR[color].rune}">
                    <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${GLYPHS[i]}"/></svg>
                </button>
            `;
            layer.appendChild(wrap);
            return { wrap, button: wrap.querySelector("button"), fireball: wrap.querySelector("[data-fireball]"), color, isUsed: false, x: pos[i].x, y: pos[i].y };
        });

        // 1) Reveal clockwise, each rune popping in its color
        const step = revealMs / COUNT;
        runes.forEach((r, i) => later(() => {
            r.button.style.opacity = "1";
            r.button.animate?.([ { transform: "scale(0.3)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" } ], { duration: 220, easing: "ease-out" });
            buzz(4);
        }, i * step));

        // 2) All up: they turn blue and a fireball lights behind each
        later(() => {
            runes.forEach((r) => {
                r.button.className = r.button.className.replace(COLOR[r.color].rune, COLOR.blue.rune);
                r.fireball.classList.remove("hidden");
                r.fireball.animate?.([
                    { transform: "translate(-50%,-50%) scale(0.85)", opacity: 0.7 },
                    { transform: "translate(-50%,-55%) scale(1.15)", opacity: 1 },
                ], { duration: 300 + Math.random() * 200, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
            });
            buzz([ 10, 30, 10 ]);
        }, revealMs + 150);

        // 3) Ask for a color and start the clock
        later(() => {
            prompt.innerHTML = /*html*/`
                <div class="rounded-xl bg-black/55 px-3 py-2 text-center">
                    <p class="text-[10px] uppercase tracking-widest text-slate-300">Tap every</p>
                    <p class="font-display text-2xl font-bold uppercase tracking-wider ${COLOR[want].text}">${COLOR[want].label}</p>
                </div>
            `;
            prompt.classList.remove("hidden");
            prompt.classList.add("grid");
            runes.forEach((r) => (r.button.disabled = false));
            isAnswering = true;
            timerBar.style.transform = "scaleX(1)";
            timerBar.animate?.([ { transform: "scaleX(1)" }, { transform: "scaleX(0)" } ], { duration: answerMs, easing: "linear", fill: "forwards" });
            later(endRound, answerMs);
        }, revealMs + 750);

        const onTap = (e) => {
            const i = Number(e.currentTarget?.dataset?.rune);
            const r = runes[i];
            e.preventDefault();
            if (!isAnswering || !r || r.isUsed) return;
            r.isUsed = true;
            r.button.disabled = true;
            if (r.color === want) {
                // Right: the rune bursts
                right++;
                forgeSparks(stage, r.x, r.y, 90);
                buzz(14);
                r.wrap.animate?.([ { transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1.8)", opacity: 0 } ], { duration: 260, fill: "forwards" });
                if (right >= total) endRound();
            } else {
                // Wrong: show what it really was
                wrong++;
                r.button.className = r.button.className.replace(COLOR.blue.rune, COLOR[r.color].rune);
                r.fireball.classList.add("hidden");
                shake(panel, 20);
                buzz([ 30, 20, 30 ]);
            }
        };
        runes.forEach((r) => r.button.addEventListener("pointerdown", onTap));

        let isEnded = false;
        function endRound() {
            if (isEnded || isDone) return;
            isEnded = true;
            isAnswering = false;
            timerBar.getAnimations?.().forEach((a) => a.pause());
            runes.forEach((r) => (r.button.disabled = true));
            prompt.classList.add("hidden");
            prompt.classList.remove("grid");

            const score = Math.max(0, Math.min(100, Math.round(((right - wrong) / total) * 100)));
            scores.push(score);
            el.querySelector("[data-chips]").innerHTML = chips(rounds, scores);

            // Everything still standing drifts into the weapon
            const box = stage.getBoundingClientRect();
            runes.filter((r) => !(r.isUsed && r.color === want)).forEach((r, k) => {
                r.wrap.animate?.([
                    { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
                    { transform: `translate(calc(-50% + ${box.width / 2 - r.x}px), calc(-50% + ${box.height / 2 - r.y}px)) scale(0.2)`, opacity: 0 },
                ], { duration: 520, delay: k * 25, easing: "ease-in", fill: "forwards" });
            });
            el.querySelector("[data-weapon]")?.animate?.([
                { filter: "brightness(1)" }, { filter: "brightness(2) drop-shadow(0 0 18px rgba(56,189,248,0.9))" }, { filter: "brightness(1)" },
            ], { duration: 700, delay: 450 });

            const label = grade(score);
            later(() => {
                announce(stage, label, 1000, score >= 70 ? "text-sky-200" : score >= 30 ? "text-amber-200" : "text-slate-300", "text-5xl");
                if (score >= 70) shake(panel, score);
                buzz(score >= 70 ? [ 14, 30, 14 ] : 20);
            }, 650);

            if (scores.length >= rounds) later(() => onDone(average(scores)), 1800);
            else later(playRound, 1800);
        }
    };

    const stopCountdown = countdown(stage, roll.difficulty, playRound);

    return () => {
        isDone = true;
        stopCountdown();
        timers.forEach(clearTimeout);
    };
};

export { mountRune };
