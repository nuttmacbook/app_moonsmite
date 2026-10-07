// Progress goes on-chain only with the game's signature. The signer key lives in a Vercel
// Function (app_game/api/sign.js, env SIGNER_KEY), never in the browser: this asks it to check
// the stats against the chain and sign them.

/**
 * Signs progress for several weapons in one request.
 * @param {string} owner  the connected wallet that will send the transaction
 * @param {{ tokenId: string, stats: object }[]} items  stats from forge.statsForChain()
 * @returns {Promise<{ tokenId: string, stats: object, deadline: string, sig: string }[]>}
 */
async function signUploads(owner, items) {
    let res;
    try {
        res = await fetch("/api/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner, items }),
        });
    } catch {
        throw new Error("Could not reach the game server. Check your connection and try again.");
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? "Your progress could not be signed. Please try again.");
    return json.items;
}

/**
 * Signs progress for one weapon. Bound to this owner, weapon and its on-chain nonce, so the
 * signature works for exactly one transaction.
 * @returns {Promise<{ stats: object, deadline: string, sig: string }>}
 */
async function signUpload(owner, tokenId, stats) {
    const [ signed ] = await signUploads(owner, [ { tokenId: String(tokenId), stats } ]);
    return { stats: signed.stats, deadline: signed.deadline, sig: signed.sig };
}

export { signUpload, signUploads };
