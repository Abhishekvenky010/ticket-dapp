"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { getNFTs } from "../../lib/getNFTs";

type NFT = {
  name?: string;
  address?: { toString: () => string };
  uri?: string;
};

type NFTMetadata = {
  name?: string;
  description?: string;
  image?: string;
};

export default function CreateAuctionPage() {
  const wallet = useWallet();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [metadata, setMetadata] = useState<{[key: string]: NFTMetadata}>({});
  const [loading, setLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startingPrice: "",
    duration: "24", // hours
  });
  const [creating, setCreating] = useState(false);

  const fetchNFTs = async () => {
    try {
      const data = await getNFTs(wallet);
      setNfts(data || []);

      // Fetch metadata for each NFT
      const meta: {[key: string]: NFTMetadata} = {};
      for (const nft of data || []) {
        if (nft.uri) {
          try {
            const response = await fetch(nft.uri);
            if (response.ok) {
              const metadata = await response.json();
              meta[nft.address?.toString() || ''] = metadata;
            }
          } catch (err) {
            console.error('Error fetching metadata:', err);
          }
        }
      }
      setMetadata(meta);
    } catch (err) {
      console.error("Error fetching NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet.publicKey) {
      fetchNFTs();
    }
  }, [wallet.publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedNft) {
      alert("Please select an NFT");
      return;
    }

    const startingPrice = parseFloat(formData.startingPrice);
    if (!startingPrice || startingPrice <= 0) {
      alert("Please enter a valid starting price");
      return;
    }

    const duration = parseInt(formData.duration);
    if (!duration || duration <= 0) {
      alert("Please enter a valid duration");
      return;
    }

    setCreating(true);
    try {
      const endTime = new Date(Date.now() + duration * 60 * 60 * 1000);
      const selectedNftData = nfts.find(nft => nft.address?.toString() === selectedNft);
      const meta = metadata[selectedNft];

      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nftMint: selectedNft,
          name: formData.name || selectedNftData?.name || "Unnamed NFT",
          description: formData.description || meta?.description || "",
          imageUrl: meta?.image || "",
          startingPrice,
          seller: wallet.publicKey?.toString(),
          endTime: endTime.toISOString(),
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert("✅ Auction created successfully!");
      router.push("/auctions");
    } catch (err) {
      console.error(err);
      alert("❌ Error creating auction: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setCreating(false);
    }
  };

  if (!wallet.publicKey) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect your wallet to create auctions for your NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create NFT Auction</h1>
        <p className="text-gray-600 dark:text-gray-300">Put your event tickets up for auction</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎟️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No NFTs found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">You need NFTs to create auctions</p>
          <a
            href="/mint"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
          >
            <span className="mr-2">✨</span>
            Mint Your First NFT
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* NFT Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Select NFT</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nfts.map((nft, i) => {
                const nftAddress = nft.address?.toString() || "";
                const meta = metadata[nftAddress];
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedNft(nftAddress)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedNft === nftAddress
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {meta?.image && (
                        <img
                          src={meta.image}
                          alt={nft.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {nft.name || meta?.name || "Unnamed NFT"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {nftAddress.slice(0, 8)}...{nftAddress.slice(-8)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auction Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Auction Details</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Auction Title *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VIP Concert Tickets"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your auction..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Starting Price (SOL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (hours) *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creating || !selectedNft}
                className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {creating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Auction...
                  </div>
                ) : (
                  "🏆 Create Auction"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}