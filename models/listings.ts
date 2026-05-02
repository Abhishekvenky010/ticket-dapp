import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  nftMint: { type: String, required: true },  // NFT mint address
  name: { type: String, required: true },     // Ticket name (e.g., "Concert Ticket")
  price: { type: Number, required: true },    // Price in SOL (lamports for precision)
  seller: { type: String, required: true },   // Seller's wallet public key
  maxResalePrice: { type: Number, default: null },  // Optional max resale price
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema);