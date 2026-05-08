"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { mintNFT } from "../lib/mintNFT";

export default function MintTicket() {
  const wallet = useWallet();
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mintPrice, setMintPrice] = useState("");
  const [maxResalePrice, setMaxResalePrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMint = async () => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    if (!imageFile) {
      alert("Please select an image");
      return;
    }

    setLoading(true);
    try {
      // Upload image to Pinata via API
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);

      const imageResponse = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData
      });

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.url;
      if (!imageUrl) throw new Error("Failed to upload image");

      // Create metadata
      const metadata = {
        name: eventName,
        description: eventDescription,
        image: imageUrl,
        attributes: []
      };

      // Upload metadata to Pinata via API
      const metadataResponse = await fetch('/api/upload-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata)
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || 'Failed to upload metadata');
      }

      const metadataData = await metadataResponse.json();
      const metadataUri = metadataData.url;
      if (!metadataUri) throw new Error("Failed to upload metadata");

      // Mint NFT with metadata URI
      const { nft } = await mintNFT(wallet, eventName, metadataUri);

      const price = parseFloat(mintPrice);
      const maxResale = parseFloat(maxResalePrice) || null;
      if(price>0){
        await fetch("/api/listings",{
          method:"POST",
          headers:{"Content-Type": "application/json"},
              body: JSON.stringify({
      nftMint: nft.address.toString(),
      name: eventName,
      description: eventDescription,
      imageUrl: imageUrl,
      price,
      seller: wallet.publicKey.toString(),
      maxResalePrice: maxResale
    })
        });
         alert("Ticket minted and listed!");
      } else {
        alert("Ticket minted!");
      }
    } catch (err) {
      console.error(err);
      alert("Error minting NFT");
    } finally {
      setLoading(false);
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
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <input
        type="number"
        placeholder="Mint Price (SOL)"
        value={mintPrice}
        onChange={(e) => setMintPrice(e.target.value)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <input
        type="number"
        placeholder="Max Resale Price (SOL, optional)"
        value={maxResalePrice}
        onChange={(e) => setMaxResalePrice(e.target.value)}
        className="block w-full px-3 py-2 border rounded mb-2"
      />
      <button
        onClick={handleMint}
        disabled={loading}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Minting..." : "Mint Ticket NFT 🎟️"}
      </button>
    </div>
  );
}