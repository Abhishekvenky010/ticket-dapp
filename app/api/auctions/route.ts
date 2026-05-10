import { connectDB } from "@/lib/db";
import Auction from "@/models/auctions";
import { NextResponse } from "next/server";

// GET all auctions
export async function GET() {
  try {
    await connectDB();
    const auctions = await Auction.find().sort({ createdAt: -1 });
    return NextResponse.json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 });
  }
}

// POST new auction
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { nftMint, seller, endTime } = body;

    // Validate end time is in the future
    if (new Date(endTime) <= new Date()) {
      return NextResponse.json(
        { error: 'Auction end time must be in the future' },
        { status: 400 }
      );
    }

    // Check if this NFT is already in an active auction
    const existingAuction = await Auction.findOne({
      nftMint,
      status: 'active'
    });
    if (existingAuction) {
      return NextResponse.json(
        { error: 'This NFT is already in an active auction' },
        { status: 409 }
      );
    }

    const auction = await Auction.create(body);
    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error creating auction:', error);
    return NextResponse.json({ error: 'Failed to create auction' }, { status: 500 });
  }
}