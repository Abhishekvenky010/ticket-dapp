"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

type Auction = {
  _id: string;
  nftMint: string;
  name: string;
  description?: string;
  imageUrl?: string;
  startingPrice: number;
  currentBid: number;
  currentBidder: string;
  seller: string;
  endTime: string;
  status: 'active' | 'ended' | 'cancelled';
  bids: Array<{
    bidder: string;
    amount: number;
    timestamp: string;
  }>;
};

export default function AuctionsPage() {
  const wallet = useWallet();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmounts, setBidAmounts] = useState<{[key: string]: string}>({});
  const [bidding, setBidding] = useState<string | null>(null);

  const fetchAuctions = async () => {
    try {
      const res = await fetch("/api/auctions");
      if (!res.ok) {
        console.error("Failed to fetch auctions:", res.status, res.statusText);
        setAuctions([]);
        return;
      }
      const data = await res.json();
      setAuctions(data);
    } catch (error) {
      console.error("Error fetching auctions:", error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleBid = async (auctionId: string) => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    const bidAmount = parseFloat(bidAmounts[auctionId]);
    if (!bidAmount || bidAmount <= 0) {
      alert("Enter a valid bid amount");
      return;
    }

    setBidding(auctionId);
    try {
      const response = await fetch(`/api/auctions/${auctionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bidder: wallet.publicKey.toString(),
          amount: bidAmount
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("✅ Bid placed successfully!");
      setBidAmounts(prev => ({ ...prev, [auctionId]: "" }));
      fetchAuctions(); // Refresh auctions
    } catch (err) {
      console.error(err);
      alert("❌ Error placing bid: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setBidding(null);
    }
  };

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">NFT Auctions</h1>
        <p className="text-gray-600 dark:text-gray-300">Bid on exclusive event tickets</p>
        <div className="mt-4">
          <Link
            href="/create-auction"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors"
          >
            <span className="mr-2">🏆</span>
            Create Auction
          </Link>
        </div>
      </div>

      {/* Auctions Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No auctions found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Be the first to create an auction!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <div key={auction._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden">
              <div className="aspect-square relative">
                {auction.imageUrl ? (
                  <img
                    src={auction.imageUrl}
                    alt={auction.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 flex items-center justify-center">
                    <span className="text-4xl">🏆</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                  {auction.status === 'active' ? formatTimeLeft(auction.endTime) : 'Ended'}
                </div>
                {auction.currentBid > 0 && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Current: {auction.currentBid} SOL
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">{auction.name}</h3>
                {auction.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{auction.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Starting:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{auction.startingPrice} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bids:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{auction.bids.length}</span>
                  </div>
                </div>

                {auction.status === 'active' && new Date(auction.endTime) > new Date() ? (
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Min bid: ${auction.currentBid > 0 ? auction.currentBid + 0.01 : auction.startingPrice} SOL`}
                      value={bidAmounts[auction._id] || ""}
                      onChange={(e) => setBidAmounts(prev => ({ ...prev, [auction._id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={bidding === auction._id}
                    />
                    <button
                      onClick={() => handleBid(auction._id)}
                      disabled={bidding === auction._id}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bidding === auction._id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Bid...
                        </div>
                      ) : (
                        "Place Bid"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {auction.status === 'ended' ? 'Auction Ended' : 'Coming Soon'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}