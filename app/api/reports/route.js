import connectDB from "@/lib/mongoose";
import Report from "@/models/Report";
import { getAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get("status")) filter.status = searchParams.get("status");
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    return Response.json(reports);
  } catch (err) {
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { category, description, role, phone } = await request.json();
    if (!description?.trim()) {
      return Response.json({ error: "Description is required" }, { status: 400 });
    }
    const report = await Report.create({ category, description: description.trim(), role, phone });
    return Response.json(report, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
