import { box, getRpc } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { Coin } from "../contracts/contract_coin";
import { normalize } from "../errors";

/**
 * Mints a copy of one of this hour's shelf swords, approving the coin first when needed.
 * Price and look come from the contract, so there is nothing to sign server-side.
 *
 * @param {object} wallet  current wallet state
 * @param {{ round: string, slot: number, price: string }} item  shelf item the player picked
 * @param {string} referrer  needed on the first purchase only, ZERO after
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 *        called before each wallet prompt so the UI can say what is being signed
 * @returns {Promise<object>} the transaction receipt
 */
export async function mintSword(wallet, item, referrer, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;
    const PRICE = BigInt(item?.price ?? 0);

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }
    if (PRICE <= 0n) throw new Error("This shelf has changed. Pick a weapon again.");

    onStep({ stage: "checking", index: 0, total: 1 });

    const isApproved = await box.isTokenApproval(Coin, account, Forge.address, PRICE, getRpc());

    // Two wallet prompts when approval is still needed, one when it is not
    const total = isApproved ? 1 : 2;

    // Fail before any signature if the balance cannot cover it
    try {
        const token = box.createWeb3Contract(Coin, getRpc());
        const balance = await token.methods.balanceOf(account).call();
        if (BigInt(balance ?? 0) < PRICE) {
            throw new Error("Not enough MWLD in your wallet.");
        }
    } catch (error) {
        if (/Not enough MWLD/.test(error?.message)) throw error;
        // balanceOf unavailable — let the contract decide instead of blocking here
    }

    if (!isApproved) {
        onStep({ stage: "approve", index: 1, total });
        try {
            const token = box.createEtherContract(Coin, signer);
            const tx = await token.approve(Forge.address, PRICE);
            onStep({ stage: "approving", index: 1, total });
            await tx.wait();
        } catch (error) {
            const handled = box.handleTxError(Coin, error);
            throw normalize(error, handled, "Approval failed. Please try again.");
        }
    }

    onStep({ stage: "create", index: total, total });
    try {
        const value = BigInt(1e14);
        const engine = box.createEtherContract(Forge, signer);
        const tx = await engine.mintSword(item.round, item.slot, referrer ?? box.ZERO, { value });
        onStep({ stage: "creating", index: total, total });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "The weapon could not be minted.");
    }
}
