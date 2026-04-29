"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { mintNFT } from "../lib/mintNFT";

export default function MintTicket() {
  const wallet = useWallet();

  const handleMint = async () => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    try {
      const nft = await mintNFT(wallet);

      console.log("NFT:", nft);

      alert("🎉 Ticket NFT Minted!");
    } catch (err) {
      console.error(err);
      alert("Error minting NFT");
    }
  };

  return (
    <button
      onClick={handleMint}
      className="bg-purple-600 text-white px-6 py-2 rounded-lg mt-4 hover:bg-purple-700"
    >
      Mint Ticket NFT 🎟️
    </button>
  );
}