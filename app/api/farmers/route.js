import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "approved", "pending", "rejected", or null (all active)
    const filter = { active: true };
    if (status) filter.status = status;
    else filter.status = "approved"; // default: only approved farmers shown publicly
    const farmers = await Farmer.find(filter).sort({ createdAt: -1 });
    return Response.json(farmers);
  } catch (err) {
    return Response.json({ error: "Failed to fetch farmers" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // If a record already exists for this phone, return it instead of creating a duplicate
    if (body.phone) {
      const existing = await Farmer.findOne({ phone: body.phone.trim(), active: true });
      if (existing) return Response.json(existing, { status: 200 });
    }

    body.status = "pending";
    const farmer = await Farmer.create(body);
    return Response.json(farmer, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create farmer" }, { status: 500 });
  }
}
