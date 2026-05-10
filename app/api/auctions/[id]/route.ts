import { connectDB } from "@/lib/db";
import Auction from "@/models/auctions";
import { NextResponse } from "next/server";

// GET auction by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const auction = await Auction.findById(resolvedParams.id);
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }
    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    return NextResponse.json({ error: 'Failed to fetch auction' }, { status: 500 });
  }
}

// POST bid on auction
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const body = await req.json();
    const { bidder, amount } = body;

    const resolvedParams = await params;
    const auction = await Auction.findById(resolvedParams.id);
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
    }

    if (new Date() > auction.endTime) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 });
    }

    if (amount <= auction.currentBid) {
      return NextResponse.json({ error: 'Bid must be higher than current bid' }, { status: 400 });
    }

    if (amount < auction.startingPrice && auction.currentBid === 0) {
      return NextResponse.json({ error: 'Bid must be at least the starting price' }, { status: 400 });
    }

    // Add bid to auction
    auction.bids.push({ bidder, amount, timestamp: new Date() });
    auction.currentBid = amount;
    auction.currentBidder = bidder;

    await auction.save();
    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 });
  }
}

// PUT end auction
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const resolvedParams = await params;
    const auction = await Auction.findById(resolvedParams.id);
    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
    }

    auction.status = 'ended';
    await auction.save();

    return NextResponse.json(auction);
  } catch (error) {
    console.error('Error ending auction:', error);
    return NextResponse.json({ error: 'Failed to end auction' }, { status: 500 });
  }
}