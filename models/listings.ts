import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  nftMint: { type: String, required: true },  // NFT mint address
  name: { type: String, required: true },     // Ticket name (e.g., "Concert Ticket")
  description: { type: String, default: "" }, // Ticket description
  imageUrl: { type: String, default: "" },    // Ticket image URL
  price: { type: Number, required: true },    // Price in SOL (lamports for precision)
  seller: { type: String, required: true },   // Seller's wallet public key
  createdAt: { type: Date, default: Date.now },
  maxResalePrice: { type: Number, default: null },
});

export default mongoose.models.Listing || mongoose.model("Listing", ListingSchema);