import { connectDB } from "@/lib/db";
import Listing from "@/models/listings";
import { NextResponse } from "next/server";

// GET all listings
export async function GET() {
  await connectDB();
  const listings = await Listing.find();
  return NextResponse.json(listings);
}

// POST new listing
export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();

  const listing = await Listing.create(body);

  return NextResponse.json(listing);
}