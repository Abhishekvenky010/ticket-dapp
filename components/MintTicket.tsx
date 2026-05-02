"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { mintNFT } from "../lib/mintNFT";

export default function MintTicket() {
  const wallet = useWallet();
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [mintPrice, setMintPrice] = useState("");

  const handleMint = async () => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    try {
      const nft = await mintNFT(wallet, eventName, eventDescription);

      console.log("NFT:", nft);

      alert("🎉 Ticket NFT Minted!");
      const price = parseFloat(mintPrice);
      if(price>0){
        await fetch("/api/listings",{
          method:"POST",
          headers:{"Content-Type": "application/json"},
              body: JSON.stringify({
      nftMint: nft.address.toString(),  // Assuming nft has address
      name: eventName,
      price,
      seller: wallet.publicKey.toString()
    })
        });
         alert("Ticket minted and listed!");
      }
    } catch (err) {
      console.error(err);
      alert("Error minting NFT");
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        placeholder="Event Name (e.g., Coliseum Hackathon)"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <input
        type="text"
        placeholder="Event Description (e.g., Exclusive event ticket)"
        value={eventDescription}
        onChange={(e) => setEventDescription(e.target.value)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <input
        type="number"
        placeholder="Mint Price (SOL)"
        value={mintPrice}
        onChange={(e) => setMintPrice(e.target.value)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <button
        onClick={handleMint}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
      >
        Mint Ticket NFT 🎟️
      </button>
    </div>
  );
}