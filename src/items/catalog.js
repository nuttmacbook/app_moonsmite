// The 40 items. Set each one on its own: name and image.
//
//   name   shown in the game and on NFT marketplaces
//   image  a file in public/items/ (PNG 512x512, transparent background), or a full https:// URL
//
// Every NFT gets one of these at mint (on-chain: seed % 40 + 1, see ForgeEngine.itemOf); on-chain
// its type is this id number. Keep the ids in place after launch. Names and images can change
// any time: edit here, then call setItems on the contract (the deploy script does it the first time)
// so NFT marketplaces show the same items.

const ITEMS = [
    { id:  1, name: "Aegis Lance",        image: "Aegis_Lance.png" },
    { id:  2, name: "Arc Rune",           image: "Arc_Rune.png" },
    { id:  3, name: "Astral Links",       image: "Astral_Links.png" },
    { id:  4, name: "Blackwake",          image: "Blackwake.png" },
    { id:  5, name: "Blast Pick",         image: "Blast_Pick.png" },
    { id:  6, name: "Bloodhawk",          image: "Bloodhawk.png" },
    { id:  7, name: "Cyclone Fang",       image: "Cyclone_Fang.png" },
    { id:  8, name: "Doomchain",          image: "Doomchain.png" },
    { id:  9, name: "Eclipse Staff",      image: "Eclipse_Staff.png" },
    { id: 10, name: "Fateweave",          image: "Fateweave.png" },
    { id: 11, name: "Forgebreaker",       image: "Forgebreaker.png" },
    { id: 12, name: "Gear Frame",         image: "Gear_Frame.png" },
    { id: 13, name: "Ghostblade",         image: "Ghostblade.png" },
    { id: 14, name: "Gold Breaker",       image: "Gold_Breaker.png" },
    { id: 15, name: "Helltrigger",        image: "Helltrigger.png" },
    { id: 16, name: "Hexbranch",          image: "Hexbranch.png" },
    { id: 17, name: "Inferno Elixirs",    image: "Inferno_elixirs.png" },
    { id: 18, name: "Iron Ravens",        image: "Iron_Ravens.png" },
    { id: 19, name: "Iron Storm",         image: "Iron_Storm.png" },
    { id: 20, name: "Katana",             image: "Katana.png" },
    { id: 21, name: "Lightning Spinner",  image: "Lightning_Spinner.png" },
    { id: 22, name: "Moonblade",          image: "Moonblade.png" },
    { id: 23, name: "Moonbow",            image: "Moonbow.png" },
    { id: 24, name: "Myst Spire",         image: "Myst_Spire.png" },
    { id: 25, name: "Night Fang",         image: "Night_Fang.png" },
    { id: 26, name: "Nova Ray",           image: "Nova_Ray.png" },
    { id: 27, name: "Saint Light",        image: "Saint_Light.png" },
    { id: 28, name: "Scimitar",           image: "Scimitar.png" },
    { id: 29, name: "Skull Cleaver",      image: "Skull_Cleaver.png" },
    { id: 30, name: "Soul Reaper",        image: "Soul_Reaper.png" },
    { id: 31, name: "Soul Strings",       image: "Soul_strings.png" },
    { id: 32, name: "Stormbatons",        image: "Stormbatons.png" },
    { id: 33, name: "Stormbolt",          image: "Stormbolt.png" },
    { id: 34, name: "Thornlash",          image: "Thornlash.png" },
    { id: 35, name: "Tidebreaker",        image: "Tidebreaker.png" },
    { id: 36, name: "Tiger Fists",        image: "Tiger_Fists.png" },
    { id: 37, name: "Valor Crest",        image: "Valor_Crest.png" },
    { id: 38, name: "Void Codex",         image: "Void_Codex.png" },
    { id: 39, name: "Wildclaws",          image: "Wildclaws.png" },
    { id: 40, name: "Zen Strike",         image: "Zen_Strike.png" },
];

const isFullUrl = (path) => /^[a-z]+:\/\//i.test(String(path ?? ""));

/** Same rule as the contract: seed % 40 + 1 */
const itemIdOf = (seed) => Number(BigInt(seed ?? 0) % BigInt(ITEMS.length)) + 1;

/** @returns {{ id: number, name: string, image: string }} */
const itemOf = (seed) => {
    const id = itemIdOf(seed);
    const item = ITEMS.find((x) => x.id === id) ?? { id, name: `Item ${id}`, image: `${id}.png` };
    const image = isFullUrl(item.image) ? item.image : `/items/${item.image || `${id}.png`}`;
    return { id, name: item.name, image };
};

export { ITEMS, itemOf, itemIdOf };
