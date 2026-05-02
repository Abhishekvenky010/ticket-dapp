"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getNFTs } from "../lib/getNFTs";

type NFT = {
  name?: string;
  address?: { toString: () => string };
};

export default function MyTickets() {
  const wallet = useWallet();
  const [tickets, setTickets] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [listingPrices, setListingPrices] = useState<{[key: string]: string}>({});
  const [maxResalePrices, setMaxResalePrices] = useState<{[key: string]: string}>({});).

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!wallet.publicKey) return;

      setLoading(true);
      try {
        const data = await getNFTs(wallet);
        setTickets(data || []);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [wallet]);

  const handleList = async (ticket: NFT) => {
    const price = parseFloat(listingPrices[ticket.address ? ticket.address.toString() : ""]);
    if (!price || price <= 0) {
      alert("Enter a valid price in SOL");
      return;
    }

    try {
      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nftMint: ticket.address?.toString(),
          name: ticket.name || "Ticket",
          price,
          seller: wallet.publicKey?.toString()
        })
      });
      alert("Ticket listed for sale!");
      setListingPrices(prev => ({ ...prev, [ticket.address ? ticket.address.toString() : ""]: "" }));
    } catch (err) {
      console.error(err);
      alert("Error listing ticket");
    }
  };

  if (!wallet.publicKey) {
    return (
      <p className="mt-6 text-gray-600">
        Connect wallet to see your tickets
      </p>
    );
  }

  return (
    <div className="mt-8 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4 text-center">
        My Tickets 🎟️
      </h2>

      {loading && <p>Loading tickets...</p>}

      {!loading && tickets.length === 0 && (
        <p className="text-gray-500 text-center">
          No tickets found
        </p>
      )}

      {tickets.map((t, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-xl shadow-md mb-3"
        >
          <h3 className="font-semibold text-lg">
            {t.name || "Untitled Ticket"}
          </h3>

          <p className="text-sm text-gray-500 break-all">
            {t.address?.toString()}
          </p>

          <span className="text-green-600 text-sm font-medium">
            Owned
          </span>

          <div className="mt-2 flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Price in SOL"
              value={listingPrices[t.address ? t.address.toString() : ""] || ""}
              onChange={(e) => setListingPrices(prev => ({ ...prev, [t.address ? t.address.toString() : ""]: e.target.value }))}
              className="flex-1 px-2 py-1 border rounded"
            />
            <button
              onClick={() => handleList(t)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              <input
              type="number"
              step="0.01"
              placeholder="Max Resale Price in SOL (optional)"
              value={maxResalePrices[t.address ? t.address.toString() : ""] || ""}>
              </input>
              List
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
