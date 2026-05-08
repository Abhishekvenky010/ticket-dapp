import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { connection } from "./solana";

export const mintNFT = async (wallet: WalletContextState, name: string, uri: string) => {
    try {
        // Validate inputs
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!name || !uri) {
            throw new Error("Invalid NFT name or metadata URI");
        }

        // Validate URI format
        if (!uri.startsWith('http') && !uri.startsWith('ipfs://') && !uri.startsWith('https://')) {
            throw new Error("Invalid metadata URI format");
        }

        // Ensure URI doesn't contain 'undefined' which indicates failed upload
        if (uri.includes('undefined')) {
            throw new Error("Metadata URI contains 'undefined' - upload may have failed");
        }

        const metaplex = Metaplex.make(connection).use(
            walletAdapterIdentity(wallet)
        );

        console.log("Minting NFT:", { name, uri });

        const { nft, response } = await metaplex.nfts().create({
            name: name,
            symbol: "TIX",
            uri: uri,
            sellerFeeBasisPoints: 0
        });

        if (!nft || !response) {
            throw new Error("NFT minting failed - no response received");
        }

        console.log("NFT minted successfully:", nft.address.toString());
        return { nft, response };

    } catch (error) {
        console.error("NFT minting failed:", error);
        throw error; // Re-throw to let caller handle
    }
};