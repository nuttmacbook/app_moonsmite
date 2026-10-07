import { rng, countdown, buzz, average, chips, forgeSparks, shake, callout, verdict } from "./kit";

// Flame burn: hold anywhere to blow fire on the weapon and let go when it reaches the target heat.
// The weapon glows orange, then red, then burns black, licked by flames and finally smoking.
// Each hold has its own random target time; letting go right on it scores 100.
// The heat bar shows the target mark and a needle for the current heat.
// Settings live in MINIGAME.burn and MINIGAME.levels at the top of game/forge.js.

// Heat colors from cold to burnt: [heat 0-1, r, g, b, tint strength]
const STOPS = [
    [ 0.00, 255, 255, 255, 0.00 ],
    [ 0.25, 251, 191,  36, 0.55 ],   // amber
    [ 0.45, 249, 115,  22, 0.80 ],   // orange
    [ 0.65, 220,  38,  38, 0.90 ],   // red
    [ 0.85, 127,  29,  29, 0.95 ],   // deep red
    [ 1.00,  12,  10,  10, 1.00 ],   // burnt black
];

/** Color and tint strength of the weapon at a heat from 0 (cold) to 1 (black) */
const heatColor = (h) => {
    const x = Math.max(0, Math.min(1, h));
    const i = Math.max(1, STOPS.findIndex((s) => s[0] >= x));
    const [ a, b ] = [ STOPS[i - 1], STOPS[i] ];
    const t = (x - a[0]) / (b[0] - a[0] || 1);
    const mix = (k) => Math.round(a[k] + (b[k] - a[k]) * t);
    return { rgb: `rgb(${mix(1)}, ${mix(2)}, ${mix(3)})`, strength: a[4] + (b[4] - a[4]) * t };
};

// A flame goes white-hot at the root, yellow, orange, red, then fades to smoke
const FLAME_COLORS = [ "#fffbe6", "#fde047", "#fb923c", "#dc2626", "rgba(60, 30, 30, 0)" ];

/** One tongue of flame: a blurred teardrop that grows, rises, cools in color and fades */
const tongue = (layer, x, y, dx, dy, size, life) => {
    const f = document.createElement("span");
    f.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 1.35}px;`
        + `margin:${-size * 0.67}px 0 0 ${-size / 2}px;border-radius:50% 50% 45% 45% / 62% 62% 38% 38%;`
        + `pointer-events:none;mix-blend-mode:screen;filter:blur(${(size / 14).toFixed(1)}px);`;
    layer.appendChild(f);
    const wob = () => (Math.random() - 0.5) * size * 0.8;
    f.animate([
        { transform: "translate(0,0) scale(0.35)", background: FLAME_COLORS[0], opacity: 1 },
        { transform: `translate(${dx * 0.3 + wob()}px, ${dy * 0.3}px) scale(0.9)`, background: FLAME_COLORS[1], opacity: 0.95, offset: 0.2 },
        { transform: `translate(${dx * 0.65 + wob()}px, ${dy * 0.65}px) scale(1.3)`, background: FLAME_COLORS[2], opacity: 0.85, offset: 0.5 },
        { transform: `translate(${dx * 0.9 + wob()}px, ${dy * 0.9}px) scale(1.5)`, background: FLAME_COLORS[3], opacity: 0.55, offset: 0.78 },
        { transform: `translate(${dx + wob()}px, ${dy}px) scale(1.7)`, background: FLAME_COLORS[4], opacity: 0 },
    ], { duration: life, easing: "cubic-bezier(.3,.6,.4,1)" }).onfinish = () => f.remove();
};

/** Grey smoke curling up off a weapon that is burning black */
const smoke = (layer, x, y) => {
    const s = document.createElement("span");
    const size = 22 + Math.random() * 20;
    s.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;`
        + "border-radius:9999px;pointer-events:none;background:radial-gradient(circle,rgba(70,70,80,0.55),transparent 70%);filter:blur(4px);";
    layer.appendChild(s);
    s.animate([
        { transform: "translate(0,0) scale(0.6)", opacity: 0 },
        { transform: `translate(${(Math.random() - 0.5) * 20}px, -30px) scale(1.2)`, opacity: 0.7, offset: 0.3 },
        { transform: `translate(${(Math.random() - 0.5) * 50}px, -90px) scale(2)`, opacity: 0 },
    ], { duration: 1300 + Math.random() * 500, easing: "ease-out" }).onfinish = () => s.remove();
};

/**
 * @param {HTMLElement} el
 * @param {object} roll  from the strike: difficulty, heatSec, seed, burn (settings), image
 * @param {(score: number) => void} onDone  average score 0-100
 */
const mountBurn = (el, roll = {}, onDone) => {
    const cfg = roll.burn ?? {};
    const blows = Number(cfg.blows ?? 5);
    const heatSec = Math.max(0.5, Number(roll.heatSec ?? 2.5));
    // burn.hardness narrows the perfect window and steepens the falloff (3 = three times harder)
    const hardness = Math.max(0.1, Number(cfg.hardness ?? 1));
    const perfect = Number(cfg.perfectSec ?? 0.06) / hardness;
    const falloff = Math.max(0.03, Number(cfg.falloffSec ?? 0.6) / hardness);
    const minHold = Number(cfg.minHoldSec ?? 0.3);
    // Targets stay below full black so there is always a right moment to let go
    const maxHold = Math.min(Number(cfg.maxHoldSec ?? 2.0), heatSec * 0.9);
    const rand = rng(roll.seed);
    const image = roll.image ?? "";

    const scores = [];
    let target = 0;
    let heldFrom = 0;
    let isHolding = false;
    let isLive = false;      // holds only count once the countdown is over and a target is set
    let isDone = false;
    let frame = 0;
    let fireTimer = 0;
    let jetFlicker = null;
    const timers = [];

    el.innerHTML = /*html*/`
        <div class="flex flex-col gap-3">
            <div data-stage class="stage relative h-60 touch-none select-none overflow-hidden">
                <!-- เป้าความร้อน -->
                <div data-target class="absolute left-3 top-3 z-[5] hidden items-center gap-2 rounded bg-black/40 px-2 py-1">
                    <span class="text-[10px] uppercase tracking-wider text-slate-300">Heat to</span>
                    <span data-target-swatch class="h-4 w-8 rounded ring-1 ring-white/40"></span>
                </div>

                <!-- อาวุธ: ภาพจริง ทับด้วยสีความร้อนในรูปทรงเดียวกัน -->
                <div data-weapon class="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
                    <div data-glow class="absolute -inset-8 rounded-full" style="opacity:0;background:radial-gradient(circle,rgba(253,186,116,0.55),rgba(220,38,38,0.3) 45%,transparent 70%);"></div>
                    ${image ? `<img src="${image}" alt="" width="512" height="512" draggable="false" class="relative h-full w-full select-none object-contain">` : ""}
                    <div data-tint class="absolute inset-0" style="opacity:0;-webkit-mask:url('${image}') center/contain no-repeat;mask:url('${image}') center/contain no-repeat;"></div>
                </div>

                <!-- เปลวไฟ -->
                <div data-fire class="pointer-events-none absolute inset-0"></div>

                <!-- หัวพ่นไฟ -->
                <div class="pointer-events-none absolute bottom-4 left-4 h-8 w-12 rounded-r-full bg-gradient-to-r from-slate-600 to-slate-400 shadow-[inset_0_-3px_0_rgba(0,0,0,0.35)]"></div>
                <div data-jet class="pointer-events-none absolute bottom-[30px] left-14 h-7 origin-left rounded-r-full" style="opacity:0;filter:blur(3px);mix-blend-mode:screen;background:linear-gradient(90deg,rgba(255,255,240,0.95),rgba(253,224,71,0.85) 22%,rgba(249,115,22,0.6) 55%,rgba(220,38,38,0.25) 80%,transparent);"></div>

                <!-- หลอดความร้อน -->
                <div class="absolute bottom-3 right-3 z-[5] h-3 w-40 overflow-hidden rounded-full bg-[linear-gradient(90deg,#e2e8f0,#fbbf24_25%,#f97316_45%,#dc2626_65%,#7f1d1d_85%,#0c0a0a)] ring-1 ring-white/30">
                    <div data-meter-target class="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.9)]"></div>
                    <div data-meter-needle class="absolute -inset-y-1 w-0.5 -translate-x-1/2 bg-sky-300" style="left:0%"></div>
                </div>
                <p data-hint class="pointer-events-none absolute bottom-3 left-20 hidden text-[11px] uppercase tracking-widest text-slate-300">Hold to fire</p>
            </div>
            <div data-chips class="flex gap-1.5">${chips(blows, scores)}</div>
        </div>
    `;

    const stage = el.querySelector("[data-stage]");
    const fire = el.querySelector("[data-fire]");
    const jet = el.querySelector("[data-jet]");
    const tint = el.querySelector("[data-tint]");
    const glow = el.querySelector("[data-glow]");
    const targetBox = el.querySelector("[data-target]");
    const swatch = el.querySelector("[data-target-swatch]");
    const meterTarget = el.querySelector("[data-meter-target]");
    const needle = el.querySelector("[data-meter-needle]");
    const hint = el.querySelector("[data-hint]");
    const panel = el.closest("[data-strike-panel]") ?? stage;

    const heldSec = () => (performance.now() - heldFrom) / 1000;

    const paint = (heat) => {
        const c = heatColor(heat);
        tint.style.background = c.rgb;
        tint.style.opacity = String(c.strength);
        glow.style.opacity = String(Math.min(1, heat * 1.4) * (heat > 0.9 ? 0.4 : 1));
        needle.style.left = `${Math.min(100, heat * 100)}%`;
    };

    /** Points the jet from the nozzle at the weapon */
    const aimJet = () => {
        const box = stage.getBoundingClientRect();
        const fromX = 56;
        const fromY = box.height - 44;
        const toX = box.width / 2;
        const toY = box.height / 2;
        const length = Math.hypot(toX - fromX, toY - fromY) * 0.85;
        jet.style.width = `${length}px`;
        jet.style.transform = `rotate(${(Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI}deg)`;
        return { fromX, fromY, toX, toY };
    };

    /** One burst of fire: tongues along the jet, flames licking up the weapon, smoke when it chars */
    const burn = () => {
        const { fromX, fromY, toX, toY } = aimJet();
        const heat = heldSec() / heatSec;
        // Jet: tongues streaming from the nozzle and spreading over the weapon
        for (let i = 0; i < 3; i++) {
            const spread = (Math.random() - 0.5) * 50;
            tongue(fire, fromX, fromY, toX - fromX + spread, toY - fromY - 10 + spread * 0.5, 14 + Math.random() * 14, 380 + Math.random() * 220);
        }
        // Weapon catches: flames climb off it, more as it heats
        if (heat > 0.15) {
            const n = heat > 0.5 ? 3 : 1;
            for (let i = 0; i < n; i++) {
                const x = toX + (Math.random() - 0.5) * 90;
                const y = toY + 20 + (Math.random() - 0.5) * 60;
                tongue(fire, x, y, (Math.random() - 0.5) * 16, -(45 + Math.random() * 45), 10 + Math.random() * 12 + heat * 8, 500 + Math.random() * 300);
            }
        }
        if (heat > 0.8 && Math.random() < 0.5) smoke(fire, toX + (Math.random() - 0.5) * 60, toY - 10);
    };

    const loop = () => {
        if (isDone) return;
        if (isHolding) {
            const s = heldSec();
            paint(s / heatSec);
            // Way past black: let go for the player
            if (s > heatSec * 1.15) release();
        }
        frame = requestAnimationFrame(loop);
    };

    /** Picks the next target and shows it as a color swatch and a mark on the heat bar */
    const nextTarget = () => {
        target = +(minHold + rand() * Math.max(0.05, maxHold - minHold)).toFixed(2);
        swatch.style.background = heatColor(target / heatSec).rgb;
        targetBox.classList.remove("hidden");
        targetBox.classList.add("flex");
        meterTarget.style.left = `${(target / heatSec) * 100}%`;
        hint.classList.remove("hidden");
        paint(0);
        isLive = true;
    };

    const press = (e) => {
        e?.preventDefault?.();
        if (!isLive || isHolding || isDone) return;
        isHolding = true;
        heldFrom = performance.now();
        hint.classList.add("hidden");
        aimJet();
        jet.style.opacity = "1";
        jetFlicker = jet.animate?.([
            { transform: `${jet.style.transform} scaleY(0.8)` },
            { transform: `${jet.style.transform} scaleY(1.25) scaleX(1.04)` },
            { transform: `${jet.style.transform} scaleY(0.9) scaleX(0.97)` },
        ], { duration: 120, iterations: Infinity, direction: "alternate" }) ?? null;
        burn();
        fireTimer = setInterval(burn, 35);
        buzz(10);
    };

    const stopFire = () => {
        clearInterval(fireTimer);
        jetFlicker?.cancel();
        jet.style.opacity = "0";
    };

    const release = (e) => {
        e?.preventDefault?.();
        if (!isHolding || isDone) return;
        isHolding = false;
        isLive = false;
        stopFire();
        const held = heldSec();
        const off = Math.abs(held - target);
        const score = off <= perfect ? 100 : Math.max(0, Math.round(100 * (1 - (off - perfect) / falloff)));
        scores.push(score);
        el.querySelector("[data-chips]").innerHTML = chips(blows, scores);

        // Show how close it was, then cool the weapon down for the next one
        const box = stage.getBoundingClientRect();
        forgeSparks(stage, box.width / 2, box.height / 2, score);
        shake(panel, score);
        callout(stage, `${verdict(score)} ${held.toFixed(2)}s / ${target.toFixed(2)}s`, score >= 40);
        buzz(score >= 90 ? [ 14, 30, 14 ] : 18);

        if (scores.length >= blows) {
            isDone = true;
            cancelAnimationFrame(frame);
            timers.push(setTimeout(() => onDone(average(scores)), 900));
            return;
        }
        const startHeat = held / heatSec;
        const coolFrom = performance.now();
        const cool = () => {
            const t = Math.min(1, (performance.now() - coolFrom) / 700);
            paint(startHeat * (1 - t));
            if (t < 1 && !isDone) requestAnimationFrame(cool);
        };
        requestAnimationFrame(cool);
        timers.push(setTimeout(() => !isDone && nextTarget(), 900));
    };

    const onKeyDown = (e) => {
        if ((e.code === "Space" || e.code === "Enter") && !e.repeat) press(e);
    };
    const onKeyUp = (e) => {
        if (e.code === "Space" || e.code === "Enter") release(e);
    };

    stage.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const stopCountdown = countdown(stage, roll.difficulty, () => {
        if (isDone) return;
        frame = requestAnimationFrame(loop);
        nextTarget();
    });

    return () => {
        isDone = true;
        cancelAnimationFrame(frame);
        stopFire();
        stopCountdown();
        timers.forEach(clearTimeout);
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
    };
};

export { mountBurn };
