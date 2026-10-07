import { box } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { normalize } from "../errors";

/**
 * Save all: uploads the progress of several weapons in one transaction (one gas fee),
 * each with its own app signature. The contract takes up to 30 at a time.
 *
 * @param {object} wallet  current wallet state
 * @param {{ tokenId: string, stats: object, deadline: string, sig: string }[]} items  from signUpload()
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function saveAll(wallet, items, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }
    if (!Array.isArray(items) || items.length === 0) throw new Error("Nothing new to save.");
    if (items.length > 30) throw new Error("Save at most 30 weapons at a time.");

    onStep({ stage: "create", index: 1, total: 1 });
    try {
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.syncMany(items);
        onStep({ stage: "creating", index: 1, total: 1 });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "Progress could not be saved.");
    }
}
