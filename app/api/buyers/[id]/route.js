import connectDB from "@/lib/mongoose";
import Buyer from "@/models/Buyer";
import { getAuth } from "@/lib/auth";

export async function DELETE(request, { params: rawParams }) {
  try {
    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    await connectDB();
    const params = await rawParams;
    await Buyer.findByIdAndDelete(params.id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Failed to delete buyer" }, { status: 500 });
  }
}
