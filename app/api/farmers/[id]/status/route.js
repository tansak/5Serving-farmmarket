import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";
import { getAuth } from "@/lib/auth";

export async function PATCH(request, { params: rawParams }) {
  try {
    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();
    const params = await rawParams;
    const { status, rejectionReason } = await request.json();

    if (!["approved", "rejected", "pending"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const farmer = await Farmer.findByIdAndUpdate(
      params.id,
      { status, rejectionReason: rejectionReason || "" },
      { new: true }
    );
    if (!farmer) return Response.json({ error: "Farmer not found" }, { status: 404 });

    return Response.json(farmer);
  } catch (err) {
    return Response.json({ error: "Failed to update farmer status" }, { status: 500 });
  }
}
