import Listing from "@/models/listings";
import { connectDB } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ db: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    await Listing.findByIdAndDelete(resolvedParams.db);
    return new Response("Listing deleted", { status: 200 });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return new Response("Failed to delete listing", { status: 500 });
  }
}
