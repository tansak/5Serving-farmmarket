import connectDB from "@/lib/mongoose";
import Report from "@/models/Report";
import { getAuth } from "@/lib/auth";

export async function PATCH(request, { params: rawParams }) {
  try {
    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    await connectDB();
    const params = await rawParams;
    const { status } = await request.json();
    if (!["open", "resolved", "dismissed"].includes(status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    const report = await Report.findByIdAndUpdate(params.id, { status }, { new: true });
    if (!report) return Response.json({ error: "Report not found" }, { status: 404 });
    return Response.json(report);
  } catch (err) {
    return Response.json({ error: "Failed to update report" }, { status: 500 });
  }
}
