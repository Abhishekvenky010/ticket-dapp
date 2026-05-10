import {Connection , clusterApiUrl} from "@solana/web3.js";

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";

export const connection = new Connection(
    clusterApiUrl(SOLANA_NETWORK as "devnet" | "mainnet-beta" | "testnet"),"confirmed"
);