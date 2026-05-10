"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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

export default function MyNFTsPage() {
  const wallet = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [metadata, setMetadata] = useState<{[key: string]: NFTMetadata}>({});
  const [metadataLoading, setMetadataLoading] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [listingPrices, setListingPrices] = useState<{[key: string]: string}>({});
  const [maxResalePrices, setMaxResalePrices] = useState<{[key: string]: string}>({});
  const [listingLoading, setListingLoading] = useState<{[key: string]: boolean}>({});

  const fetchMetadata = async (uri: string): Promise<NFTMetadata> => {
    if (!uri || uri === 'undefined' || uri === '' || uri.includes('undefined')) {
      console.log('Skipping metadata fetch for invalid URI:', uri);
      return {};
    }

    const cleanUri = uri.trim();

    if (cleanUri.startsWith('data:')) {
      try {
        const base64 = cleanUri.split(',')[1];
        const json = JSON.parse(Buffer.from(base64, 'base64').toString());
        return json;
      } catch (e) {
        console.error('Error parsing data URI:', e);
        return {};
      }
    } else {
      // Try multiple IPFS gateways if the first one fails
      const gateways = [
        cleanUri,
        cleanUri.replace('https://gateway.pinata.cloud/ipfs/', 'https://ipfs.io/ipfs/'),
        cleanUri.replace('https://gateway.pinata.cloud/ipfs/', 'https://cloudflare-ipfs.com/ipfs/'),
      ];

      for (const gatewayUri of gateways) {
        try {
          // Add timeout and better error handling
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

          const res = await fetch(gatewayUri, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; NFTApp/1.0)',
            }
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            if (res.status === 404) {
              console.log(`Metadata not found (404) for URI: ${gatewayUri}`);
              continue; // Try next gateway
            }
            console.error(`Failed to fetch metadata from ${gatewayUri}: ${res.status} ${res.statusText}`);
            continue; // Try next gateway
          }

          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            // Sometimes IPFS gateways return HTML error pages
            if (contentType && contentType.includes('text/html')) {
              console.log(`Gateway returned HTML error page for URI: ${gatewayUri}`);
              continue; // Try next gateway
            }
            console.error(`Invalid content type from ${gatewayUri}:`, contentType);
            continue; // Try next gateway
          }

          const data = await res.json();

          // Validate that we got actual metadata
          if (data && typeof data === 'object' && (data.name || data.description || data.image)) {
            console.log(`Successfully fetched metadata from ${gatewayUri}`);
            return data;
          } else {
            console.log(`Invalid metadata structure from ${gatewayUri}:`, data);
            continue; // Try next gateway
          }

        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') {
            console.log(`Metadata fetch timeout for ${gatewayUri}`);
          } else {
            console.log(`Error fetching metadata from ${gatewayUri}:`, e instanceof Error ? e.message : e);
          }
          continue; // Try next gateway
        }
      }

      console.log(`Failed to fetch metadata from all gateways for URI: ${cleanUri}`);
      return {};
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!wallet.publicKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getNFTs(wallet);
        setNfts(data || []);

        // Initialize metadata loading states
        const loadingStates: {[key: string]: boolean} = {};
        (data || []).forEach(nft => {
          const nftAddress = nft.address?.toString() || '';
          loadingStates[nftAddress] = true;
        });
        setMetadataLoading(loadingStates);

        // Fetch metadata for each NFT
        const meta: {[key: string]: NFTMetadata} = {};
        const metadataPromises = (data || []).map(async (nft) => {
          const nftAddress = nft.address?.toString() || '';
          if (nft.uri) {
            try {
              const metadata = await fetchMetadata(nft.uri);
              meta[nftAddress] = metadata;
              console.log(`Fetched metadata for NFT ${nftAddress}:`, metadata.name || 'unnamed');
            } catch (err) {
              console.error(`Error fetching metadata for NFT ${nftAddress}:`, err);
              meta[nftAddress] = {}; // Set empty metadata on error
            }
          } else {
            meta[nftAddress] = {};
          }

          // Update loading state for this NFT
          setMetadataLoading(prev => ({ ...prev, [nftAddress]: false }));
        });

        // Wait for all metadata fetches to complete
        await Promise.allSettled(metadataPromises);
        setMetadata(meta);
      } catch (err) {
        console.error("Error fetching NFTs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [wallet.publicKey]);

  const handleList = async (nft: NFT) => {
    const nftAddress = nft.address?.toString() || "";
    const price = parseFloat(listingPrices[nftAddress]);
    const maxResalePrice = parseFloat(maxResalePrices[nftAddress]) || null;

    if (!price || price <= 0) {
      alert("Enter a valid price in SOL");
      return;
    }

    setListingLoading(prev => ({ ...prev, [nftAddress]: true }));

    try {
      const meta = metadata[nftAddress];
      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nftMint: nftAddress,
          name: nft.name || "Ticket",
          description: meta?.description || "",
          imageUrl: meta?.image || "",
          price,
          seller: wallet.publicKey?.toString(),
          maxResalePrice: maxResalePrice
        })
      });

      alert("Ticket listed for sale!");
      setListingPrices(prev => ({ ...prev, [nftAddress]: "" }));
      setMaxResalePrices(prev => ({ ...prev, [nftAddress]: "" }));
    } catch (err) {
      console.error(err);
      alert("Error listing ticket");
    } finally {
      setListingLoading(prev => ({ ...prev, [nftAddress]: false }));
    }
  };

  if (!wallet.publicKey) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h1>
          <p className="text-gray-600 dark:text-gray-300">Connect your Solana wallet to view your NFT collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My NFT Collection</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage and list your event tickets</p>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 text-xl">🎟️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total NFTs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{nfts.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-blue-600 dark:text-blue-400 text-xl">💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Collection Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full h-full flex items-center justify-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 hover:from-green-100 hover:to-blue-100 dark:hover:from-green-800 dark:hover:to-blue-800 transition-colors rounded-lg border-2 border-dashed border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
          >
            <div className="text-center">
              <div className="text-green-600 dark:text-green-400 text-xl mb-1">🔄</div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Refresh Metadata</p>
              <p className="text-xs text-green-600 dark:text-green-400">Retry failed loads</p>
            </div>
          </button>
        </div>
      </div>

      {/* NFTs Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎟️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No NFTs found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't minted any tickets yet</p>
          <a
            href="/mint"
            className="inline-flex items-center px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
          >
            <span className="mr-2">✨</span>
            Mint Your First NFT
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft, i) => {
            const nftAddress = nft.address?.toString() || "";
            const meta = metadata[nftAddress];
            const isMetadataLoading = metadataLoading[nftAddress];
            const isListing = listingLoading[nftAddress];

            return (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="aspect-square relative">
                  {isMetadataLoading ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-600 dark:to-blue-600 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400"></div>
                    </div>
                  ) : meta?.image ? (
                    <img
                      src={meta.image}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  {!isMetadataLoading && !meta?.image && (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
                      <span className="text-4xl">🎟️</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 dark:bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Owned
                  </div>
                </div>

                <div className="p-4">
                  {isMetadataLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 truncate">
                        {nft.name || meta?.name || "Untitled Ticket"}
                      </h3>
                      {meta?.description ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{meta.description}</p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 italic">No description available</p>
                      )}
                    </>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono break-all">
                    {nftAddress.slice(0, 8)}...{nftAddress.slice(-8)}
                  </p>

                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price in SOL"
                      value={listingPrices[nftAddress] || ""}
                      onChange={(e) => setListingPrices(prev => ({ ...prev, [nftAddress]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={isListing}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Max Resale Price (optional)"
                      value={maxResalePrices[nftAddress] || ""}
                      onChange={(e) => setMaxResalePrices(prev => ({ ...prev, [nftAddress]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={isListing}
                    />
                    <button
                      onClick={() => handleList(nft)}
                      disabled={isListing}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-500 dark:to-blue-500 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isListing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Listing...
                        </div>
                      ) : (
                        "List for Sale"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}