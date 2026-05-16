import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const farmer = await Farmer.findById(params.id);
    if (!farmer) return Response.json({ error: "Farmer not found" }, { status: 404 });
    return Response.json(farmer);
  } catch (err) {
    return Response.json({ error: "Failed to fetch farmer" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    const farmer = await Farmer.findByIdAndUpdate(params.id, body, { new: true });
    if (!farmer) return Response.json({ error: "Farmer not found" }, { status: 404 });
    return Response.json(farmer);
  } catch (err) {
    return Response.json({ error: "Failed to update farmer" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await Farmer.findByIdAndUpdate(params.id, { active: false });
    return Response.json({ success: true, message: "Farmer deactivated" });
  } catch (err) {
    return Response.json({ error: "Failed to delete farmer" }, { status: 500 });
  }
}
