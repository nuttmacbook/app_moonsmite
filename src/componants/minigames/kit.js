// Shared pieces for the strike minigame: phone first (whole stage is the tap target),
// haptics where the phone supports them, and a blade on an anvil to hit.

const LEVELS = {
    easy:   { label: "Easy",   tone: "text-emerald-200 ring-emerald-300/50 bg-emerald-400/10" },
    normal: { label: "Normal", tone: "text-cyan-200 ring-cyan-300/50 bg-cyan-400/10" },
    hard:   { label: "Hard",   tone: "text-fuchsia-200 ring-fuchsia-300/60 bg-fuchsia-500/15" },
    insane: { label: "Insane", tone: "text-red-200 ring-red-400/70 bg-red-500/20" },
};

/** Seeded random, so reopening a strike replays the same targets */
const rng = (seed) => {
    let t = (Number(seed) >>> 0) || 1;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
};

// Countdown before every minigame: 4, 3, 2, 1, the level, then START!
const COUNT_FROM = 4;
const BEAT_MS = 650;
const LEVEL_MS = 900;
const START_MS = 600;
const LEVEL_TONE = { easy: "text-emerald-200", normal: "text-cyan-200", hard: "text-fuchsia-200", insane: "text-red-300" };

/** One big word in the middle of the stage, popping in and fading out */
const announce = (stage, text, ms, tone = "text-amber-50", size = "text-7xl") => {
    const node = document.createElement("div");
    // Above the weapon, with a dark halo so the word reads clearly over the art
    node.className = "pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[radial-gradient(circle,rgba(2,6,23,0.7),transparent_60%)]";
    node.innerHTML = `<span class="font-display ${size} font-bold uppercase tracking-wider ${tone} [text-shadow:0_0_18px_rgba(252,211,77,0.8),0_2px_0_rgba(0,0,0,0.6)]">${text}</span>`;
    stage.appendChild(node);
    node.animate?.([
        { transform: "scale(1.8)", opacity: 0 },
        { transform: "scale(1)", opacity: 1, offset: 0.25 },
        { transform: "scale(1)", opacity: 1, offset: 0.75 },
        { transform: "scale(0.85)", opacity: 0 },
    ], { duration: ms, easing: "ease-out" });
    return setTimeout(() => node.remove(), ms);
};

/**
 * Runs the countdown on a stage, then calls onGo.
 * @returns {() => void} cancels the countdown (for Close mid-way)
 */
const countdown = (stage, difficulty, onGo) => {
    const timers = [];
    let isCancelled = false;
    const level = difficulty in LEVELS ? difficulty : "normal";
    let at = 300;
    for (let n = COUNT_FROM; n >= 1; n--) {
        const value = n;
        timers.push(setTimeout(() => {
            if (isCancelled) return;
            timers.push(announce(stage, String(value), BEAT_MS));
            buzz(8);
        }, at));
        at += BEAT_MS;
    }
    timers.push(setTimeout(() => !isCancelled && timers.push(announce(stage, LEVELS[level].label, LEVEL_MS, LEVEL_TONE[level], "text-5xl")), at));
    at += LEVEL_MS;
    timers.push(setTimeout(() => {
        if (isCancelled) return;
        timers.push(announce(stage, "Start!", START_MS, "text-amber-200", "text-6xl"));
        buzz([ 20, 40, 20 ]);
    }, at));
    at += START_MS * 0.6;
    timers.push(setTimeout(() => !isCancelled && onGo(), at));
    return () => {
        isCancelled = true;
        timers.forEach(clearTimeout);
    };
};

const buzz = (ms = 12) => {
    try {
        navigator.vibrate?.(ms);
    } catch {}
};

const average = (scores) => Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));

/** Score boxes under the stage, filled as the player goes */
const chips = (count, scores) => Array.from({ length: count }, (_, i) => {
    const s = scores[i];
    const tone = s === undefined ? "bg-white/5 text-slate-600"
        : s >= 90 ? "bg-amber-300 text-slate-950"
        : s >= 50 ? "bg-violet-500/70 text-violet-50"
        : "bg-slate-700 text-slate-300";
    return `<span class="grid h-7 min-w-0 flex-1 place-items-center rounded font-mono text-[10px] font-bold tabular-nums ${tone}">${s ?? ""}</span>`;
}).join("");

/** Spark shower at a point inside `layer` (a position:relative element) */
/**
 * Sparks off a hammer blow on hot iron: bright streaks thrown out and up, then falling.
 * Better hits throw more and hotter sparks.
 */
const forgeSparks = (layer, x, y, score = 50) => {
    const count = 14 + Math.round(score / 4);
    const colors = score >= 75 ? [ "#fffbeb", "#fde68a", "#fbbf24", "#fb923c" ] : [ "#fed7aa", "#fb923c", "#ea580c", "#9a3412" ];
    for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        // Mostly upward fan, some sideways
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const speed = 50 + Math.random() * (score >= 75 ? 120 : 70);
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const life = 380 + Math.random() * 420;
        const len = 6 + Math.random() * 10;
        spark.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${len}px;height:2px;border-radius:2px;pointer-events:none;`
            + `background:${colors[i % colors.length]};box-shadow:0 0 6px 1px rgba(251,146,60,0.9);transform-origin:left center;`;
        layer.appendChild(spark);
        const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
        spark.animate([
            { transform: `translate(0,0) rotate(${rot}deg)`, opacity: 1 },
            { transform: `translate(${dx * 0.7}px, ${dy * 0.7}px) rotate(${rot}deg)`, opacity: 1, offset: 0.55 },
            // gravity pulls them down at the end
            { transform: `translate(${dx}px, ${dy + 40}px) rotate(${rot + 40}deg) scaleX(0.4)`, opacity: 0 },
        ], { duration: life, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => spark.remove();
    }
    // A white-hot flash at the point of impact
    const flash = document.createElement("span");
    flash.style.cssText = `position:absolute;left:${x - 30}px;top:${y - 30}px;width:60px;height:60px;border-radius:9999px;pointer-events:none;`
        + "background:radial-gradient(circle,rgba(255,251,235,0.95),rgba(251,191,36,0.5) 40%,transparent 70%);";
    layer.appendChild(flash);
    flash.animate([ { transform: "scale(0.4)", opacity: 1 }, { transform: "scale(1.6)", opacity: 0 } ], { duration: 260, easing: "ease-out" }).onfinish = () => flash.remove();
};

/** Jolts the strike panel like a hammer landing; harder for better hits */
const shake = (el, score = 50) => {
    if (!el?.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const a = score >= 75 ? 16 : score > 0 ? 10 : 6;
    el.animate([
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: `translate(${-a}px, ${a * 0.7}px) rotate(-1.2deg)` },
        { transform: `translate(${a}px, ${-a * 0.6}px) rotate(1deg)` },
        { transform: `translate(${-a * 0.7}px, ${a * 0.4}px) rotate(-0.6deg)` },
        { transform: `translate(${a * 0.5}px, ${-a * 0.3}px) rotate(0.4deg)` },
        { transform: `translate(${-a * 0.25}px, ${a * 0.15}px) rotate(0deg)` },
        { transform: "translate(0,0) rotate(0deg)" },
    ], { duration: 300, easing: "ease-out" });
};

/** Floating verdict over the stage after each hit */
const callout = (layer, text, isGood) => {
    const el = document.createElement("span");
    el.className = `callout font-display text-sm font-bold uppercase tracking-widest ${isGood ? "text-cyan-100" : "text-slate-400"}`;
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 700);
};

const verdict = (score) => (score >= 95 ? "Perfect" : score >= 75 ? "Great" : score >= 40 ? "Good" : score > 0 ? "Weak" : "Miss");

/** The player's weapon, faint behind the targets, with a glow that builds as they strike */
const weaponStage = (image) => /*html*/`
    <div class="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 opacity-80">
        ${image ? `<img src="${image}" alt="" width="512" height="512" draggable="false" class="h-full w-full select-none object-contain">` : ""}
        <div data-blade-heat class="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(252,211,77,0.6),rgba(168,85,247,0.3)_45%,transparent_70%)] opacity-0 mix-blend-screen"></div>
    </div>
`;

const setHeat = (el, value) => {
    if (el) el.style.opacity = String(Math.max(0, Math.min(1, value)));
};

export { LEVELS, rng, countdown, announce, buzz, average, chips, forgeSparks, shake, callout, verdict, weaponStage, setHeat };
