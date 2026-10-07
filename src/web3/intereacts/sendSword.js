import { box } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { normalize } from "../errors";

/**
 * Sends a sword to another wallet together with the progress on this phone, so the new
 * owner gets everything and nothing is left behind on this device.
 *
 * @param {object} wallet  current wallet state
 * @param {string} to      receiving wallet address
 * @param {string} tokenId
 * @param {{ stats: object, deadline: string, sig: string }} signed  from signUpload()
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function sendSword(wallet, to, tokenId, signed, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(to ?? "")) throw new Error("That wallet address is not valid.");
    if (String(to).toLowerCase() === String(account).toLowerCase()) throw new Error("That is your own wallet.");

    onStep({ stage: "create", index: 1, total: 1 });
    try {
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.transferWithStats(to, tokenId, signed?.stats, signed?.deadline, signed?.sig);
        onStep({ stage: "creating", index: 1, total: 1 });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "The weapon could not be sent.");
    }
}
