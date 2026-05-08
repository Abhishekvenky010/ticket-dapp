import { Metaplex,walletAdapterIdentity } from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {connection} from "./solana";

export const getNFTs = async(wallet: WalletContextState) => {
    try {
        // Validate wallet connection
        if (!wallet.publicKey) {
            console.warn('Wallet not connected, cannot fetch NFTs');
            return [];
        }

        const metaplex  = Metaplex.make(connection).use(
            walletAdapterIdentity(wallet)
        );

        const nfts = await metaplex.nfts().findAllByOwner({
            owner : wallet.publicKey,
        });

        console.log(`Found ${nfts.length} NFTs for wallet ${wallet.publicKey?.toString()}`);

        // Filter out NFTs without valid URIs and validate they exist on-chain
        const validNfts = [];
        for (const nft of nfts) {
            const uri = nft.uri;
            const hasValidUri = uri && typeof uri === 'string' && uri.trim() !== '' && uri !== 'undefined';

            if (!hasValidUri) {
                console.log(`Filtering out NFT ${nft.address.toString()} - invalid URI: "${uri}"`);
                continue;
            }

            // Check if URI looks like a valid IPFS or HTTP URL
            const isValidUri = uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('ipfs://') || uri.startsWith('data:');
            if (!isValidUri) {
                console.log(`Filtering out NFT ${nft.address.toString()} - invalid URI format: "${uri}"`);
                continue;
            }

            // Check if URI contains 'undefined' which indicates a failed upload
            if (uri.includes('undefined')) {
                console.log(`Filtering out NFT ${nft.address.toString()} - URI contains 'undefined': "${uri}"`);
                continue;
            }

            // Validate that the NFT mint account exists on-chain
            try {
                const accountInfo = await connection.getAccountInfo(nft.address);
                if (!accountInfo) {
                    console.log(`Filtering out NFT ${nft.address.toString()} - mint account does not exist on-chain`);
                    continue;
                }
            } catch (error) {
                console.log(`Error validating NFT ${nft.address.toString()}:`, error);
                continue;
            }

            validNfts.push(nft);
        }

        console.log(`Returning ${validNfts.length} valid NFTs out of ${nfts.length} total NFTs`);
        return validNfts;

    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return [];
    }
};