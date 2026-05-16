import connectDB from "@/lib/mongoose";
import Community from "@/models/Community";

export async function GET() {
  try {
    await connectDB();
    const communities = await Community.find({ active: true }).sort({ createdAt: -1 });
    return Response.json(communities);
  } catch (err) {
    return Response.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const community = await Community.create(body);
    return Response.json(community, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create community" }, { status: 500 });
  }
}
