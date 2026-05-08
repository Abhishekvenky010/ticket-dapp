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
  const [maxResalePrices, setMaxResalePrices] = useState<{[key: string]: string}>({});
  const [metadata, setMetadata] = useState<{[key: string]: {name?: string, description?: string, image?: string}}>({});

  const fetchMetadata = async (uri: string): Promise<{name?: string, description?: string, image?: string}> => {
    if (!uri || uri === 'undefined' || uri === '' || uri.includes('undefined')) return {};

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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const res = await fetch(gatewayUri, {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; NFTApp/1.0)',
            }
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            if (res.status === 404) continue;
            continue;
          }

          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            if (contentType && contentType.includes('text/html')) continue;
            continue;
          }

          const data = await res.json();
          if (data && typeof data === 'object' && (data.name || data.description || data.image)) {
            return data;
          }

        } catch (e) {
          continue;
        }
      }

      return {};
    }
  };

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!wallet.publicKey) return;

      setLoading(true);
      try {
        const data = await getNFTs(wallet);
        setTickets(data || []);
        // Fetch metadata for each NFT
        const meta: {[key: string]: {name?: string, description?: string, image?: string}} = {};
        for (const ticket of data || []) {
          if (ticket.uri) {
            try {
              meta[ticket.address?.toString() || ''] = await fetchMetadata(ticket.uri);
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

    fetchNFTs();
  }, [wallet]);

  const handleList = async (ticket: NFT) => {
    const price = parseFloat(listingPrices[ticket.address ? ticket.address.toString() : ""]);
    const maxResalePrice = parseFloat(maxResalePrices[ticket.address ? ticket.address.toString() : ""]) || null;
    if (!price || price <= 0) {
      alert("Enter a valid price in SOL");
      return;
    }

    try {
      const meta = metadata[ticket.address?.toString() || ''];
      await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nftMint: ticket.address?.toString(),
          name: ticket.name || "Ticket",
          description: meta?.description || "",
          imageUrl: meta?.image || "",
          price,
          seller: wallet.publicKey?.toString(),
          maxResalePrice: maxResalePrice
        })
      });
      alert("Ticket listed for sale!");
      setListingPrices(prev => ({ ...prev, [ticket.address ? ticket.address.toString() : ""]: "" }));
      setMaxResalePrices(prev => ({ ...prev, [ticket.address ? ticket.address.toString() : ""]: "" }));
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

      {tickets.map((t, i) => {
        const meta = metadata[t.address?.toString() || ''];
        return (
        <div
          key={i}
          className="bg-white p-4 rounded-xl shadow-md mb-3"
        >
          {meta?.image && <img src={meta.image} alt={t.name} className="w-full h-32 object-cover rounded mb-2" />}
          <h3 className="font-semibold text-lg">
            {t.name || "Untitled Ticket"}
          </h3>
          {meta?.description && <p className="text-sm text-gray-600">{meta.description}</p>}

          <p className="text-sm text-gray-500 break-all">
            {t.address?.toString()}
          </p>

          <span className="text-green-600 text-sm font-medium">
            Owned
          </span>

          <div className="mt-2 flex flex-col gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Price in SOL"
              value={listingPrices[t.address ? t.address.toString() : ""] || ""}
              onChange={(e) => setListingPrices(prev => ({ ...prev, [t.address ? t.address.toString() : ""]: e.target.value }))}
              className="px-2 py-1 border rounded"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Max Resale Price in SOL (optional)"
              value={maxResalePrices[t.address ? t.address.toString() : ""] || ""}
              onChange={(e) => setMaxResalePrices(prev => ({ ...prev, [t.address ? t.address.toString() : ""]: e.target.value }))}
              className="px-2 py-1 border rounded"
            />
            <button
              onClick={() => handleList(t)}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              List
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}
