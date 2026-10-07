import { itemOf } from "../items/catalog";

// Weapon art comes from the 40 PNGs in public/items; the grade adds a glow, heat adds plasma

const GRADES = [
    { min: 95, label: "S", tone: "text-fuchsia-200", glow: "#f0abfc" },
    { min: 85, label: "A", tone: "text-cyan-200",    glow: "#67e8f9" },
    { min: 70, label: "B", tone: "text-violet-300",  glow: "#c4b5fd" },
    { min: 50, label: "C", tone: "text-slate-300",   glow: "" },
    { min: 0,  label: "D", tone: "text-slate-500",   glow: "" },
];

/** Average strike quality out of 100 plus a letter grade; no strikes yet means no grade */
const gradeOf = (totalScore, strikes) => {
    const count = Number(strikes ?? 0);
    if (count <= 0) return { label: "—", avg: 0, tone: "text-slate-500", glow: "" };
    const avg = Number(totalScore ?? 0) / count;
    const grade = GRADES.find((g) => avg >= g.min) ?? GRADES[GRADES.length - 1];
    return { ...grade, avg };
};

const itemName = (seed) => itemOf(seed).name;

/**
 * @param {string|number} seed  the NFT's on-chain seed
 * @param {{ heat?: number, glow?: string, className?: string }} options
 */
const itemArt = (seed, { heat = 0, glow = "", className = "h-28 w-28" } = {}) => {
    const item = itemOf(seed);
    const shadows = [
        glow ? `drop-shadow(0 0 10px ${glow})` : "",
        heat > 0 ? `drop-shadow(0 0 ${Math.round(8 + heat * 14)}px rgba(217,70,239,${(0.5 + heat * 0.4).toFixed(2)}))` : "",
        heat > 0 ? `saturate(${(1 + heat * 0.6).toFixed(2)}) brightness(${(1 + heat * 0.15).toFixed(2)})` : "",
    ].filter(Boolean).join(" ");

    return /*html*/`
        <img src="${item.image}" alt="${item.name}" width="512" height="512" loading="lazy" decoding="async" draggable="false"
            class="${className} select-none object-contain" style="${shadows ? `filter:${shadows}` : ""}">
    `;
};


export { itemArt, itemName, gradeOf, itemOf };
