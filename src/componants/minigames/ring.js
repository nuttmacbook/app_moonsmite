import { rng, countdown, buzz, average, chips, forgeSparks, shake, callout, verdict, weaponStage, setHeat } from "./kit";

// The strike minigame: rings close in on glowing targets. Tap anywhere the moment a ring lands.
// Targets keep coming without waiting for the last one, so several can be on screen at once;
// a tap always strikes the oldest one (its ring is the closest to landing).
// The strike's level sets the ring speed; every target rolls its own size and position.
// Settings live in MINIGAME.ring and MINIGAME.levels at the top of game/forge.js.

const START_SCALE = 3;    // rings start at 3x the target size
const MISS_SCALE = 0.35;  // a ring shrinking past this without a tap is a miss

/**
 * @param {HTMLElement} el
 * @param {object} roll  from the strike: difficulty, closeMs, seed, ring (settings), image
 * @param {(score: number) => void} onDone  average score 0-100
 */
const mountRing = (el, roll = {}, onDone) => {
    const cfg = roll.ring ?? {};
    const blows = Number(cfg.blows ?? 10);
    const closeMs = Number(roll.closeMs ?? 1100);
    const spawnMs = closeMs * Math.max(0.15, Number(cfg.spawnEvery ?? 0.5));
    const big = Number(cfg.biggestPx ?? 88);
    const small = Number(cfg.smallestPx ?? 40);
    const easy = Number(cfg.easyTolerance ?? 0.18);
    const hard = Number(cfg.hardTolerance ?? 0.05);
    // ring.hardness narrows the perfect window and steepens the falloff (3 = three times harder)
    const hardness = Math.max(0.1, Number(cfg.hardness ?? 1));
    const falloff = Number(cfg.falloff ?? 0.65) / hardness;
    const rand = rng(roll.seed);

    const scores = [];
    const active = [];   // targets on screen, oldest first
    let spawned = 0;
    let nextSpawnAt = 0;
    let frame = 0;
    let isDone = false;
    let isLive = false;          // taps only count once the countdown is over

    el.innerHTML = /*html*/`
        <div class="flex flex-col gap-3">
            <div data-stage class="stage relative h-60 touch-none select-none overflow-hidden">
                ${weaponStage(roll.image)}
            </div>
            <div data-chips class="flex gap-1">${chips(blows, scores)}</div>
        </div>
    `;

    const stage = el.querySelector("[data-stage]");
    const heat = el.querySelector("[data-blade-heat]");
    const panel = el.closest("[data-strike-panel]") ?? stage;

    /** A spot on the stage with room for the full ring, kept clear of targets already showing */
    const pickSpot = (size) => {
        const box = stage.getBoundingClientRect();
        const margin = size / 2 + 6;
        let best = null;
        for (let i = 0; i < 8; i++) {
            const x = margin + rand() * Math.max(1, box.width - margin * 2);
            const y = margin + rand() * Math.max(1, box.height - margin * 2);
            const clear = active.every((t) => Math.hypot(t.x - x, t.y - y) > (t.size + size) / 2 + 12);
            best = { x, y };
            if (clear) break;
        }
        return best;
    };

    const spawn = (now) => {
        const t = rand();
        const size = Math.round(big - t * (big - small));
        const { x, y } = pickSpot(size);
        const make = (cls) => {
            const node = document.createElement("div");
            node.className = cls;
            node.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
            stage.appendChild(node);
            return node;
        };
        const spot = make("absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-200 bg-amber-300/25 shadow-[0_0_24px_rgba(252,211,77,0.9)]");
        const ring = make("absolute rounded-full border-2 border-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.9)]");
        ring.style.transform = `translate(-50%, -50%) scale(${START_SCALE})`;
        active.push({
            spot, ring, x, y, size,
            startedAt: now,
            scale: START_SCALE,
            tolerance: (easy - t * (easy - hard)) / hardness,
        });
        spawned++;
    };

    const finish = () => {
        isDone = true;
        cancelAnimationFrame(frame);
        setTimeout(() => onDone(average(scores)), 450);
    };

    /** Scores one target and clears it; isTap means the player struck it (sparks and a jolt) */
    const resolve = (target, score, isTap) => {
        active.splice(active.indexOf(target), 1);
        scores.push(score);
        el.querySelector("[data-chips]").innerHTML = chips(blows, scores);

        if (isTap) {
            forgeSparks(stage, target.x, target.y, score);
            shake(panel, score);
        }
        callout(stage, verdict(score), score >= 40);
        setHeat(heat, Math.min(0.85, scores.length / blows));
        buzz(score >= 90 ? [ 14, 30, 14 ] : 18);

        [ target.spot, target.ring ].forEach((n) => {
            n.animate?.([ { opacity: 1 }, { opacity: 0 } ], { duration: 160 }).finished?.then(() => n.remove()).catch(() => n.remove());
            if (!n.animate) n.remove();
        });

        if (scores.length >= blows) finish();
    };

    const tick = (now) => {
        if (isDone) return;
        if (spawned < blows && now >= nextSpawnAt) {
            spawn(now);
            nextSpawnAt = now + spawnMs;
        }
        // Oldest first; a ring that shrinks past its target is a miss
        [ ...active ].forEach((t) => {
            t.scale = START_SCALE * (1 - Math.min(1, (now - t.startedAt) / closeMs));
            t.ring.style.transform = `translate(-50%, -50%) scale(${t.scale})`;
            if (t.scale <= MISS_SCALE) resolve(t, 0, false);
        });
        frame = requestAnimationFrame(tick);
    };

    const hit = (e) => {
        e?.preventDefault?.();
        if (isDone || !isLive || active.length === 0) return;
        const target = active[0];
        const off = Math.abs(target.scale - 1);
        resolve(target, off <= target.tolerance ? 100 : Math.max(0, Math.round(100 * (1 - (off - target.tolerance) / falloff))), true);
    };

    const onKey = (e) => {
        if (e.code === "Space" || e.code === "Enter") hit(e);
    };

    stage.addEventListener("pointerdown", hit);
    window.addEventListener("keydown", onKey);
    const stopCountdown = countdown(stage, roll.difficulty, () => {
        if (isDone) return;
        isLive = true;
        nextSpawnAt = performance.now();
        frame = requestAnimationFrame(tick);
    });

    return () => {
        isDone = true;
        cancelAnimationFrame(frame);
        stopCountdown();
        window.removeEventListener("keydown", onKey);
    };
};

export { mountRing };
