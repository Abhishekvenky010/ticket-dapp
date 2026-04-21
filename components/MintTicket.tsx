"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "../lib/solana";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export default function MintTicket() {
  const { publicKey, sendTransaction } = useWallet();

  const handleMint = async () => {
    if (!publicKey) {
      alert("Connect wallet first");
      return;
    }

    try {
      // For now: simple SOL transfer (acts like demo "mint")
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(publicKey), // self-transfer
          lamports: 0.01 * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);

      await connection.confirmTransaction(signature, "confirmed");

      alert("🎉 Ticket Minted (Demo)");
      console.log("Transaction:", signature);
    } catch (err) {
      console.error(err);
      alert("Error minting ticket");
    }
  };

  return (
    <button
      onClick={handleMint}
      className="bg-purple-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-purple-700"
    >
      Mint Ticket 🎟️
    </button>
  );
}