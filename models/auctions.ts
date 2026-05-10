import mongoose from "mongoose";

const AuctionSchema = new mongoose.Schema({
  nftMint: { type: String, required: true },  // NFT mint address
  name: { type: String, required: true },     // Auction title
  description: { type: String, default: "" }, // Auction description
  imageUrl: { type: String, default: "" },    // NFT image URL
  startingPrice: { type: Number, required: true }, // Starting bid in SOL
  currentBid: { type: Number, default: 0 },   // Current highest bid
  currentBidder: { type: String, default: "" }, // Current highest bidder's wallet
  seller: { type: String, required: true },   // Auction creator's wallet
  endTime: { type: Date, required: true },    // Auction end time
  status: { type: String, enum: ['active', 'ended', 'cancelled'], default: 'active' },
  bids: [{
    bidder: { type: String, required: true },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Auction || mongoose.model("Auction", AuctionSchema);