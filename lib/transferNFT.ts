import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { connection } from "./solana";
import { PublicKey } from "@solana/web3.js";

export const transferNFT = async (
    wallet: WalletContextState,
    mintAddress: string,
    toAddress: string
) => {
    try {
        // Validate inputs
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!mintAddress || !toAddress) {
            throw new Error("Invalid mint address or recipient address");
        }

        // Validate addresses are valid public keys
        let mintPublicKey: PublicKey;
        let toPublicKey: PublicKey;

        try {
            mintPublicKey = new PublicKey(mintAddress);
            toPublicKey = new PublicKey(toAddress);
        } catch (error) {
            throw new Error("Invalid public key format");
        }

        const metaplex = Metaplex.make(connection).use(
            walletAdapterIdentity(wallet)
        );

        // Check if the mint address exists on-chain
        try {
            const accountInfo = await connection.getAccountInfo(mintPublicKey);
            if (!accountInfo) {
                throw new Error(`NFT mint account ${mintAddress} does not exist on the current network (devnet). The NFT may have been minted on a different network or the minting failed.`);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('does not exist')) {
                throw error;
            }
            // If it's a different error, continue and try to find the NFT
        }

        // Find the NFT metadata
        let nft;
        try {
            nft = await metaplex.nfts().findByMint({
                mintAddress: mintPublicKey
            });
        } catch (error) {
            if (error instanceof Error && (error.message.includes('AccountNotFoundError') || error.message.includes('not found'))) {
                throw new Error(`NFT metadata not found for mint address ${mintAddress}. This NFT may not exist on the current network (devnet) or may not be a valid Metaplex NFT.`);
            }
            throw error;
        }

        if (!nft) {
            throw new Error(`NFT not found for mint address ${mintAddress}`);
        }

        // Transfer the NFT
        const { response } = await metaplex.nfts().transfer({
            nftOrSft: nft,
            fromOwner: wallet.publicKey, // Now safe - we checked it's not null above
            toOwner: toPublicKey,
        });

        console.log("NFT transfer successful:", response.signature);
        return { success: true, signature: response.signature };

    } catch (error) {
        console.error("NFT transfer failed:", error);
        throw error; // Re-throw to let caller handle
    }
};