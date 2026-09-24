import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";
import { getAuth } from "@/lib/auth";

export async function GET(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;
    const farmer = await Farmer.findById(params.id);
    if (!farmer) return Response.json({ error: "Farmer not found" }, { status: 404 });
    return Response.json(farmer);
  } catch (err) {
    return Response.json({ error: "Failed to fetch farmer" }, { status: 500 });
  }
}

export async function PATCH(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;

    const auth = getAuth(request);
    if (!auth) return Response.json({ error: "Authentication required" }, { status: 401 });

    const existing = await Farmer.findById(params.id);
    if (!existing) return Response.json({ error: "Farmer not found" }, { status: 404 });

    if (auth.role !== "admin" && auth.farmerId !== existing._id.toString()) {
      return Response.json({ error: "You can only update your own profile" }, { status: 403 });
    }

    const body = await request.json();
    const farmer = await Farmer.findByIdAndUpdate(params.id, body, { new: true });
    return Response.json(farmer);
  } catch (err) {
    return Response.json({ error: "Failed to update farmer" }, { status: 500 });
  }
}

export async function DELETE(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;

    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    await Farmer.findByIdAndUpdate(params.id, { active: false });
    return Response.json({ success: true, message: "Farmer deactivated" });
  } catch (err) {
    return Response.json({ error: "Failed to delete farmer" }, { status: 500 });
  }
}
