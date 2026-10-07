import { kitbox, chain, utils } from "kitbox";

// kitbox drives the wallet and every contract call.
// VITE_RPC_URL swaps the public RPC for your own (a paid RPC handles the marketplace load far better).
const baseNetwork = chain[import.meta.env.VITE_CHAIN ?? "bsc"];
const network = import.meta.env.VITE_RPC_URL
    ? { ...baseNetwork, rpcUrls: { ...baseNetwork.rpcUrls, default: { http: [ import.meta.env.VITE_RPC_URL ] } } }
    : baseNetwork;
const box = new kitbox();
const modal = box.createModal(import.meta.env.VITE_PROJECT_ID, [ network ], "dark");
const CHAIN_ID = BigInt(network.id);

/**
 * web3.js returns functions with several outputs as { 0, 1, __length__ } instead of an array.
 * The app reads them as arrays, so turn them into one.
 */
const asTuple = (result) => (result && typeof result === "object" && !Array.isArray(result) && "__length__" in result
    ? Array.from({ length: Number(result.__length__) }, (_, i) => result[i])
    : result);

const readAsArrays = (kit) => {
    const create = kit.createWeb3Contract.bind(kit);
    kit.createWeb3Contract = (smartcontract, rpc) => {
        const contract = create(smartcontract, rpc);
        const methods = new Proxy({}, {
            get: (_, name) => (...args) => ({
                call: async () => asTuple(await contract.methods[name](...args).call()),
            }),
        });
        return { methods };
    };
};

readAsArrays(box);

const { shortAddress, formNumber, timestampToUTC, delay } = utils;

/** RPC for reads: your own VITE_RPC_URL if set, else the chain's RPC from kitbox */
const getRpc = () => {
    if (import.meta.env.VITE_RPC_URL) return import.meta.env.VITE_RPC_URL;
    try {
        return box.getCurrentRpc();
    } catch {
        return box.rpc;
    }
};

const disconnectWallet = async () => modal?.disconnect?.();

export { box, modal, CHAIN_ID, getRpc, disconnectWallet, shortAddress, formNumber, timestampToUTC, delay };
