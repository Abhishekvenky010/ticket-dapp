"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { connection } from "../../lib/solana";
import { buyTicket } from "../../lib/buyTicket";

type Listing = {
  _id: string;
  nftMint: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  seller: string;
  maxResalePrice?: number | null;
  createdAt?: string;
};

export default function MarketplacePage() {
  const wallet = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">("newest");
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const res = await fetch("/api/listings");
      if (!res.ok) {
        console.error("Failed to fetch listings:", res.status, res.statusText);
        setListings([]);
        return;
      }
      const data = await res.json();

      // Validate listings - check if NFTs exist on current network
      const validListings = [];
      for (const listing of data) {
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(listing.nftMint));
          if (accountInfo) {
            validListings.push(listing);
          } else {
            console.warn(`Filtering out listing for non-existent NFT: ${listing.nftMint}`);
          }
        } catch (error) {
          console.warn(`Error validating listing ${listing._id}:`, error);
          // Still include it but mark it as potentially invalid
          validListings.push(listing);
        }
      }

      setListings(validListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const filteredAndSortedListings = listings
    .filter((listing) =>
      listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

  const handleBuy = async (item: Listing) => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    setBuying(item._id);
    try {
      // Validate NFT exists on current network
      try {
        const accountInfo = await connection.getAccountInfo(new PublicKey(item.nftMint));
        if (!accountInfo) {
          alert(`❌ This NFT (${item.nftMint}) does not exist on the current network. It may have been created on a different network.`);
          return;
        }
      } catch (error) {
        alert(`❌ Error validating NFT: ${error instanceof Error ? error.message : "Unknown error"}`);
        return;
      }

      // Check max resale price
      if (item.maxResalePrice && item.price > item.maxResalePrice) {
        alert(`❌ Price exceeds max resale limit of ${item.maxResalePrice} SOL`);
        return;
      }

      // Check balance
      const balance = await connection.getBalance(wallet.publicKey);
      const priceLamports = item.price * 1_000_000_000; // convert SOL → lamports

      if (balance < priceLamports) {
        alert("❌ Insufficient funds");
        return;
      }

      // Transfer SOL to seller
      await buyTicket(wallet, item.seller, priceLamports);

      // Delete listing from DB (seller will transfer NFT manually)
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">NFT Marketplace</h1>
        <p className="text-gray-600">Discover and collect unique event tickets</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-600 rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-600 rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">🎟️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-white">{listings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-600 rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Floor Price</p>
              <p className="text-2xl font-bold text-white">
                {listings.length > 0 ? Math.min(...listings.map(l => l.price)).toFixed(2) : "0.00"} SOL
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {listings.length > 0 ? (listings.reduce((sum, l) => sum + l.price, 0) / listings.length).toFixed(2) : "0.00"} SOL
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredAndSortedListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎟️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? "Try adjusting your search terms" : "No valid NFT listings found. Listings are validated against the current network (Devnet)."}
          </p>
          {!searchTerm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only NFTs that exist on the Solana Devnet network will appear here.
                Make sure you're connected to the right network and have minted NFTs on Devnet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedListings.map((item) => (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200 overflow-hidden">
              <div className="aspect-square relative">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <span className="text-4xl">🎟️</span>
                  </div>
                )}
                {item.maxResalePrice && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Max: {item.maxResalePrice} SOL
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-2xl">💰</span>
                    <span className="text-xl font-bold text-green-600">{item.price} SOL</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={buying === item._id}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {buying === item._id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buying...
                    </div>
                  ) : (
                    "Buy Now"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}