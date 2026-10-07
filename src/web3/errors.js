import { Interface } from "ethers";
import { Forge } from "./contracts/contract_forge";

// The game contract reverts with short custom errors (they keep it small). This turns them back
// into messages players can act on. Coin and wallet errors pass through as they come.

const MESSAGES = {
    // mint and sign-up
    ShelfChanged:            "The shelf just changed to the next hour. Pick again from the new weapons.",
    SoldOut:                 "Sold out for this hour. New weapons arrive next hour.",
    NoSuchSlot:              "That weapon is not on the shelf.",
    ReferrerNotFound:        "That inviter has not minted yet. Ask for another invite link.",
    SelfReferral:            "You cannot invite yourself.",
    MintFirst:               "Mint your first weapon before you can buy on the market.",
    // ownership and listings
    NotYourItem:             "This weapon is not in your wallet.",
    ItemIsListed:            "Cancel the listing first.",
    AlreadyListed:           "This weapon is already listed.",
    NotListed:               "This weapon is no longer for sale.",
    OwnItem:                 "That is your own listing.",
    PriceIsZero:             "Set a price above zero.",
    PriceChanged:            "The seller changed the price. Check it and try again.",
    SameWallet:              "That is your own wallet.",
    ZeroAddress:             "That wallet address is not valid.",
    // saving progress
    NotSignedByGame:         "Progress could not be verified. Refresh the page and try again.",
    SignatureExpired:        "That save took too long. Please try again.",
    FurnaceAboveTime:        "Your phone's clock looks ahead of the chain. Try again in a few minutes.",
    PointsAboveFurnace:      "Your phone's clock looks ahead of the chain. Try again in a few minutes.",
    PointsAboveMax:          "This weapon holds the most points it can. Spend some, then save.",
    ValueAboveCap:           "Progress could not be verified. Refresh the page and try again.",
    ScoreAboveMax:           "Progress could not be verified. Refresh the page and try again.",
    ValueWentDown:           "Newer progress is already saved. Refresh the page.",
    FurnaceWentDown:         "Newer progress is already saved. Refresh the page.",
    StrikesWentDown:         "Newer progress is already saved. Refresh the page.",
    ScoreWentDown:           "Newer progress is already saved. Refresh the page.",
    BatchSize:               "Save between 1 and 30 weapons at a time.",
    // payments and guild
    PaymentFailed:           "The payment did not go through. Check your MWLD balance.",
    FeeFailed:               "The payment did not go through. Check your MWLD balance.",
    NothingToClaim:          "Nothing to claim yet.",
    PoolEmpty:               "The guild pool is being topped up. Try again later.",
    Reentrant:               "Please wait for the last transaction to finish.",
    // owner settings
    OnlyOwner:               "Only the game owner can do that.",
    NotAllowed:              "This wallet is not allowed to do that.",
    WrongOwner:              "This weapon changed hands. Refresh the page.",
    NoToken:                 "That weapon does not exist.",
};

const iface = new Interface((Forge.abi ?? []).filter((x) => x?.type === "error"));

/** Finds the revert data wherever the wallet or RPC put it */
const revertData = (error) => {
    const spots = [
        error?.data, error?.error?.data, error?.error?.data?.originalError?.data, error?.info?.error?.data,
        error?.data?.data, error?.data?.result, error?.info?.error?.data?.result, error?.cause?.data,
    ];
    return spots.find((d) => typeof d === "string" && d.startsWith("0x") && d.length >= 10) ?? null;
};

/** The contract's custom error name, if this failure came from one */
const errorName = (error, handled) => {
    if (error?.revert?.name) return error.revert.name;
    if (handled?.parsed?.name) return handled.parsed.name;
    try {
        const data = revertData(error);
        return data ? iface.parseError(data)?.name ?? null : null;
    } catch {
        return null;
    }
};

/**
 * One readable Error for the transaction modal. Keeps the wallet's own code, so the UI can
 * still tell "you rejected it" apart from "it failed".
 */
function normalize(error, handled, fallback) {
    const name = errorName(error, handled);
    const message = (name && MESSAGES[name]) || handled?.raw?.shortMessage || error?.shortMessage || error?.reason || error?.message || fallback;
    const out = new Error(message);
    out.code = error?.code;
    out.cause = error;
    return out;
}

export { normalize, MESSAGES };
