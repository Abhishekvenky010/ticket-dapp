import Listing from "@/models/listings";
import { connectDB } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: { db: string } }) {
  await connectDB();
  await Listing.findByIdAndDelete(params.db);
  return new Response("Listing deleted", { status: 200 });
}
