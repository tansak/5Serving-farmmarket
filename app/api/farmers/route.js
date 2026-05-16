import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";

export async function GET() {
  try {
    await connectDB();
    const farmers = await Farmer.find({ active: true }).sort({ createdAt: -1 });
    return Response.json(farmers);
  } catch (err) {
    return Response.json({ error: "Failed to fetch farmers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const farmer = await Farmer.create(body);
    return Response.json(farmer, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create farmer" }, { status: 500 });
  }
}
