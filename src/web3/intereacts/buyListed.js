import { box, getRpc } from "../connect";
import { Forge } from "../contracts/contract_forge";
import { Coin } from "../contracts/contract_coin";
import { normalize } from "../errors";

/**
 * Buys a sword another player listed, paying their list price. The buyer must have minted
 * at least once, since minting is how a game ID is created.
 *
 * @param {object} wallet  current wallet state
 * @param {string} tokenId
 * @param {bigint} price   list price in wei, must match the listing
 * @param {object} options
 * @param {(step: {stage: string, index: number, total: number}) => void} options.onStep
 * @returns {Promise<object>} the transaction receipt
 */
export async function buyListed(wallet, tokenId, price, { onStep = () => {} } = {}) {
    const account = wallet?.address ?? box.ZERO;
    const signer = wallet?.signer;
    const PRICE = BigInt(price ?? 0);

    if (!account || account === box.ZERO || !signer) {
        throw new Error("Wallet is not connected.");
    }

    onStep({ stage: "checking", index: 0, total: 1 });

    const isApproved = await box.isTokenApproval(Coin, account, Forge.address, PRICE, getRpc());
    const total = isApproved ? 1 : 2;

    try {
        const token = box.createWeb3Contract(Coin, getRpc());
        const balance = await token.methods.balanceOf(account).call();
        if (BigInt(balance ?? 0) < PRICE) {
            throw new Error("Not enough MWLD in your wallet.");
        }
    } catch (error) {
        if (/Not enough MWLD/.test(error?.message)) throw error;
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
        // Price is passed so a relist at a different price cannot slip in first
        const tx = await engine.buyListed(tokenId, PRICE, { value });
        onStep({ stage: "creating", index: total, total });
        return await tx.wait();
    } catch (error) {
        const handled = box.handleTxError(Forge, error);
        throw normalize(error, handled, "The weapon could not be bought.");
    }
}
