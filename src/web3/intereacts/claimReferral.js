import { box } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { normalize } from "../errors";

/**
 * Pays out referral income: 30% of the new trading profit of every player this wallet invited.
 * Paid from the pool the team keeps in the game contract.
 *
 * @param {object} wallet  current wallet state
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function claimReferral(wallet, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }

    onStep({ stage: "create", index: 1, total: 1 });
    try {
        const value = BigInt(1e14);
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.claimReferral({ value });
        onStep({ stage: "creating", index: 1, total: 1 });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "Referral income could not be claimed.");
    }
}
