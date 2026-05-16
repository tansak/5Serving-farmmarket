import connectDB from "@/lib/mongoose";
import Produce from "@/models/Produce";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = { available: true };
    if (searchParams.get("farmerId")) filter.farmerId = searchParams.get("farmerId");
    if (searchParams.get("category")) filter.category = searchParams.get("category");
    const produce = await Produce.find(filter).sort({ createdAt: -1 });
    return Response.json(produce);
  } catch (err) {
    return Response.json({ error: "Failed to fetch produce" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const produce = await Produce.create(body);
    return Response.json(produce, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create produce" }, { status: 500 });
  }
}
