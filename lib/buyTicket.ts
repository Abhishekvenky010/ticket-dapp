import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { connection } from "./solana";

export const buyTicket = async (
    wallet: WalletContextState,
    sellerPubkey: string,
    priceLamports: number
) => {
    try {
        // Validate inputs
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }

        if (!wallet.sendTransaction) {
            throw new Error("Wallet does not support transaction sending");
        }

        if (!sellerPubkey || priceLamports <= 0) {
            throw new Error("Invalid seller address or price");
        }

        // Validate seller address is valid
        let sellerPublicKey: PublicKey;
        try {
            sellerPublicKey = new PublicKey(sellerPubkey);
        } catch (error) {
            throw new Error("Invalid seller public key format");
        }

        // Check balance before attempting transfer
        const balance = await connection.getBalance(wallet.publicKey);
        if (balance < priceLamports) {
            throw new Error(`Insufficient balance. Required: ${priceLamports} lamports, Available: ${balance} lamports`);
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey, // Now safe - we checked it's not null
                toPubkey: sellerPublicKey,
                lamports: priceLamports,
            })
        );

        // Get recent blockhash and set transaction properties
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = wallet.publicKey;

        // Sign and send transaction using wallet adapter
        const signature = await wallet.sendTransaction(transaction, connection);

        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log("Payment successful:", signature);
        return { success: true, signature };

    } catch (error) {
        console.error("Payment failed:", error);
        throw error; // Re-throw to let caller handle
    }
};