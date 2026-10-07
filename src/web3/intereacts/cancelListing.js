import { box } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { normalize } from "../errors";

/**
 * Takes a sword off the market so it can be heated or struck again.
 *
 * @param {object} wallet  current wallet state
 * @param {string} tokenId
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function cancelListing(wallet, tokenId, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }

    onStep({ stage: "create", index: 1, total: 1 });
    try {
        const value = BigInt(1e14);
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.cancelListing(tokenId, { value });
        onStep({ stage: "creating", index: 1, total: 1 });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "The listing could not be cancelled.");
    }
}
