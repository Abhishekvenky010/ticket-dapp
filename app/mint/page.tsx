"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { mintNFT } from "../../lib/mintNFT";

export default function MintPage() {
  const wallet = useWallet();
  const [formData, setFormData] = useState({
    eventName: "",
    eventDescription: "",
    eventDate: "",
    eventLocation: "",
    ticketType: "General Admission",
    price: "",
    maxResalePrice: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mintedNFT, setMintedNFT] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleMint = async () => {
    if (!wallet.publicKey) {
      alert("Connect wallet first");
      return;
    }

    if (!imageFile) {
      alert("Please select an event image");
      return;
    }

    if (!formData.eventName || !formData.eventDescription || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Upload image to Pinata via API
      console.log("Uploading image...");
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

      // Create comprehensive metadata
      const metadata = {
        name: formData.eventName,
        description: formData.eventDescription,
        image: imageUrl,
        attributes: [
          {
            trait_type: "Event Type",
            value: "Ticket"
          },
          {
            trait_type: "Ticket Type",
            value: formData.ticketType
          },
          {
            trait_type: "Event Date",
            value: formData.eventDate || "TBD"
          },
          {
            trait_type: "Location",
            value: formData.eventLocation || "TBD"
          }
        ]
      };

      console.log("Uploading metadata...");
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

      console.log("Minting NFT with URI:", metadataUri);
      // Mint NFT with metadata URI
      const { nft, response } = await mintNFT(wallet, formData.eventName, metadataUri);

      if (!nft || !nft.address) {
        throw new Error("NFT minting failed - no address returned");
      }

      console.log("NFT minted successfully:", nft.address.toString());
      setMintedNFT({ ...nft, response });

      // If price is set, list the NFT for sale
      const price = parseFloat(formData.price);
      if (price > 0) {
        console.log("Listing NFT for sale...");
        const maxResale = parseFloat(formData.maxResalePrice) || null;
        const listingResponse = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nftMint: nft.address.toString(),
            name: formData.eventName,
            description: formData.eventDescription,
            imageUrl: imageUrl,
            price,
            seller: wallet.publicKey.toString(),
            maxResalePrice: maxResale
          })
        });

        if (!listingResponse.ok) {
          console.error("Failed to list NFT for sale");
        } else {
          alert("🎉 NFT minted and listed successfully!");
        }
      } else {
        alert("🎉 NFT minted successfully!");
      }

      // Reset form
      setFormData({
        eventName: "",
        eventDescription: "",
        eventDate: "",
        eventLocation: "",
        ticketType: "General Admission",
        price: "",
        maxResalePrice: "",
      });
      setImageFile(null);
      setImagePreview(null);

    } catch (err) {
      console.error("Minting error:", err);
      alert(`❌ Error minting NFT: ${err instanceof Error ? err.message : "Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mint New NFT Ticket</h1>
        <p className="text-gray-600 dark:text-gray-300">Create and mint your event ticket as an NFT</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mint Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Ticket Details</h2>

          <div className="space-y-4">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                placeholder="e.g., Summer Music Festival 2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                required
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Description *
              </label>
              <textarea
                name="eventDescription"
                value={formData.eventDescription}
                onChange={handleInputChange}
                placeholder="Describe your event..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                required
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Date
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Event Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Location
              </label>
              <input
                type="text"
                name="eventLocation"
                value={formData.eventLocation}
                onChange={handleInputChange}
                placeholder="e.g., Central Park, New York"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Ticket Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Type
              </label>
              <select
                name="ticketType"
                value={formData.ticketType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              >
                <option value="General Admission">General Admission</option>
                <option value="VIP">VIP</option>
                <option value="Premium">Premium</option>
                <option value="Early Bird">Early Bird</option>
                <option value="Student">Student</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mint Price (SOL) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Set to 0 if you don't want to list immediately
              </p>
            </div>

            {/* Max Resale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Resale Price (SOL)
              </label>
              <input
                type="number"
                name="maxResalePrice"
                value={formData.maxResalePrice}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum price buyers can resell for (optional)
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Image *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 dark:file:bg-purple-900 file:text-purple-700 dark:file:text-purple-300 hover:file:bg-purple-100 dark:hover:file:bg-purple-800"
                required
              />
            </div>
          </div>

          {/* Mint Button */}
          <button
            onClick={handleMint}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Minting NFT...
              </div>
            ) : (
              "🎟️ Mint NFT Ticket"
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Preview</h2>

          <div className="bg-gray-50 rounded-lg p-4">
            {imagePreview ? (
              <div className="aspect-square rounded-lg overflow-hidden mb-4">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <span className="text-4xl text-gray-400">🎟️</span>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">
                {formData.eventName || "Event Name"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formData.eventDescription || "Event description will appear here..."}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-600 font-medium">
                  {formData.ticketType}
                </span>
                {formData.price && (
                  <span className="text-green-600 font-bold">
                    {formData.price} SOL
                  </span>
                )}
              </div>
              {formData.eventDate && (
                <p className="text-xs text-gray-500">
                  📅 {new Date(formData.eventDate).toLocaleDateString()}
                </p>
              )}
              {formData.eventLocation && (
                <p className="text-xs text-gray-500">
                  📍 {formData.eventLocation}
                </p>
              )}
            </div>
          </div>

          {mintedNFT && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold mb-2">✅ NFT Minted Successfully!</h3>
              <p className="text-sm text-green-700 mb-1">
                <strong>Mint Address:</strong> {mintedNFT.address.toString()}
              </p>
              <p className="text-sm text-green-700">
                <strong>Transaction:</strong>{" "}
                <a
                  href={`https://explorer.solana.com/tx/${mintedNFT.response?.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Explorer
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}