import connectDB from "@/lib/mongoose";
import Buyer from "@/models/Buyer";
import { getAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      const auth = getAuth(request);
      if (!auth || auth.role !== "admin") {
        return Response.json({ error: "phone required" }, { status: 400 });
      }
      const buyers = await Buyer.find().sort({ updatedAt: -1 });
      return Response.json(buyers);
    }

    const buyer = await Buyer.findOne({ phone });
    if (!buyer) return Response.json(null);
    return Response.json(buyer);
  } catch (err) {
    return Response.json({ error: "Failed to fetch buyer" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { phone, name, address, community } = await request.json();
    if (!phone) return Response.json({ error: "phone required" }, { status: 400 });

    const buyer = await Buyer.findOneAndUpdate(
      { phone },
      { name, address, community },
      { upsert: true, new: true }
    );
    return Response.json(buyer);
  } catch (err) {
    return Response.json({ error: "Failed to save buyer" }, { status: 500 });
  }
}
