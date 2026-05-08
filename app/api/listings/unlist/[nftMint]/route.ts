import Listing from "@/models/listings";
import { connectDB } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: { nftMint: string } }) {
  try {
    await connectDB();

    // Find and delete listing by NFT mint address and seller
    const url = new URL(req.url);
    const seller = url.searchParams.get('seller');

    if (!seller) {
      return new Response("Seller parameter required", { status: 400 });
    }

    const deletedListing = await Listing.findOneAndDelete({
      nftMint: params.nftMint,
      seller: seller
    });

    if (!deletedListing) {
      return new Response("Listing not found", { status: 404 });
    }

    return new Response("Listing removed successfully", { status: 200 });
  } catch (error) {
    console.error('Error removing listing:', error);
    return new Response("Failed to remove listing", { status: 500 });
  }
}