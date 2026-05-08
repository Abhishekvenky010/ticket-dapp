"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "../lib/solana";
import { buyTicket } from "../lib/buyTicket";
import { transferNFT } from "../lib/transferNFT";

type Listing = {
  _id: string;
  nftMint: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  seller: string;
  maxResalePrice?: number | null;
};

export default function Marketplace() {
  const wallet = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/listings")
      .then((res) => res.json())
      .then(setListings);
  }, []);

  const handleBuy = async (item: Listing) => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    setBuying(item._id);
    try {
      // Check max resale price
      if (item.maxResalePrice && item.price > item.maxResalePrice) {
        alert(`❌ Price exceeds max resale limit of ${item.maxResalePrice} SOL`);
        return;
      }

      // 1. Check balance
      const balance = await connection.getBalance(wallet.publicKey);
      const priceLamports = item.price * 1_000_000_000; // convert SOL → lamports

      if (balance < priceLamports) {
        alert("❌ Insufficient funds");
        return;
      }

      // 2. Transfer SOL to seller
      await buyTicket(wallet, item.seller, priceLamports);

      // 3. Transfer NFT to buyer
      await transferNFT(wallet, item.nftMint, wallet.publicKey.toString());

      // 4. Delete listing from DB
      await fetch(`/api/listings/${item._id}`, { method: "DELETE" });

      alert("✅ Purchase successful!");
      setListings(listings.filter(l => l._id !== item._id));
    } catch (err) {
      console.error(err);
      alert("❌ Error during purchase");
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="mt-8 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4 text-center">
        Marketplace 🛒
      </h2>

      {listings.map((item, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow-md mb-3">
          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />}
          <h3 className="font-semibold">{item.name}</h3>
          {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
          <p className="text-green-600 font-bold">{item.price} SOL</p>

          <button
            onClick={() => handleBuy(item)}
            disabled={buying === item._id}
            className="bg-green-500 text-white px-3 py-1 mt-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {buying === item._id ? "Buying..." : "Buy"}
          </button>
        </div>
      ))}
    </div>
  );
}
