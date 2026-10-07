import { box } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { normalize } from "../errors";

/**
 * Lists a sword for sale and uploads the progress kept on this phone in the same transaction,
 * so buyers see its latest value on-chain.
 *
 * @param {object} wallet  current wallet state
 * @param {string} tokenId
 * @param {bigint} price   list price in wei
 * @param {{ stats: object, deadline: string, sig: string }} signed
 *        stats from statsForChain(), signed by the app with signUpload()
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function listSword(wallet, tokenId, price, signed, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;
    const PRICE = BigInt(price ?? 0);

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }
    if (PRICE <= 0n) throw new Error("Set a price above zero.");

    onStep({ stage: "create", index: 1, total: 1 });
    try {
        const value = BigInt(1e14);
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.list(tokenId, PRICE, signed?.stats, signed?.deadline, signed?.sig, { value });
        onStep({ stage: "creating", index: 1, total: 1 });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "The weapon could not be listed.");
    }
}
