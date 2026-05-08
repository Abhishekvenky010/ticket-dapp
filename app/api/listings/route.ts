import { connectDB } from "@/lib/db";
import Listing from "@/models/listings";
import { NextResponse } from "next/server";

// GET all listings
export async function GET() {
  try {
    await connectDB();
    const listings = await Listing.find();
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

// POST new listing
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { nftMint, seller } = body;

    // Check if this NFT is already listed by this seller
    const existingListing = await Listing.findOne({ nftMint, seller });
    if (existingListing) {
      return NextResponse.json(
        { error: 'This NFT is already listed in the marketplace' },
        { status: 409 }
      );
    }

    // Check if this NFT is listed by any seller (prevent duplicate listings)
    const anyExistingListing = await Listing.findOne({ nftMint });
    if (anyExistingListing) {
      return NextResponse.json(
        { error: 'This NFT is already listed in the marketplace by another seller' },
        { status: 409 }
      );
    }

    const listing = await Listing.create(body);

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}