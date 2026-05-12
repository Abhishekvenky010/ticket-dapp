"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { connection } from "../lib/solana";
import { buyTicket } from "../lib/buyTicket";

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
      .then((res) => {
        if (!res.ok) {
          console.error("Failed to fetch listings:", res.status, res.statusText);
          return [];
        }
        return res.json();
      })
      .then(setListings)
      .catch((error) => {
        console.error("Error fetching listings:", error);
        setListings([]);
      });
  }, []);

  const handleUnlist = async (item: Listing) => {
    if (!wallet.publicKey || item.seller !== wallet.publicKey.toString()) {
      alert("You can only unlist your own listings");
      return;
    }

    try {
      await fetch(`/api/listings/${item._id}`, { method: "DELETE" });
      alert("✅ Listing removed successfully!");
      setListings(listings.filter(l => l._id !== item._id));
    } catch (err) {
      console.error(err);
      alert("❌ Error removing listing");
    }
  };

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

      // 3. Delete listing from DB (seller will transfer NFT manually)
      await fetch(`/api/listings/${item._id}`, { method: "DELETE" });

      alert("✅ Payment successful! The seller will transfer the NFT to you shortly.");
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

      {listings.map((item, i) => {
        const isOwnListing = wallet.publicKey && item.seller === wallet.publicKey.toString();
        const isBuying = buying === item._id;

        return (
          <div key={i} className="bg-white p-4 rounded-xl shadow-md mb-3">
            {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-32 object-cover rounded mb-2" />}
            <h3 className="font-semibold">{item.name}</h3>
            {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
            <p className="text-green-600 font-bold">{item.price} SOL</p>
            {isOwnListing && (
              <p className="text-xs text-blue-600 font-medium">Your listing</p>
            )}

            {isOwnListing ? (
              <button
                onClick={() => handleUnlist(item)}
                className="bg-red-500 text-white px-3 py-1 mt-2 rounded hover:bg-red-600"
              >
                Unlist
              </button>
            ) : (
              <button
                onClick={() => handleBuy(item)}
                disabled={isBuying}
                className="bg-green-500 text-white px-3 py-1 mt-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isBuying ? "Buying..." : "Buy"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
