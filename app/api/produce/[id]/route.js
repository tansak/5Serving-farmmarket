import connectDB from "@/lib/mongoose";
import Produce from "@/models/Produce";
import { getAuth } from "@/lib/auth";

export async function GET(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;
    const produce = await Produce.findById(params.id);
    if (!produce) return Response.json({ error: "Produce not found" }, { status: 404 });
    return Response.json(produce);
  } catch (err) {
    return Response.json({ error: "Failed to fetch produce" }, { status: 500 });
  }
}

export async function PATCH(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;

    const auth = getAuth(request);
    if (!auth) return Response.json({ error: "Authentication required" }, { status: 401 });

    const existing = await Produce.findById(params.id);
    if (!existing) return Response.json({ error: "Produce not found" }, { status: 404 });

    if (auth.role !== "admin" && auth.farmerId !== existing.farmerId?.toString()) {
      return Response.json({ error: "You can only update your own produce" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = {};
    if (body.quantity !== undefined) allowed.quantity = body.quantity;
    if (body.price !== undefined) allowed.price = body.price;
    if (body.available !== undefined) allowed.available = body.available;
    if (body.description !== undefined) allowed.description = body.description;

    const produce = await Produce.findByIdAndUpdate(params.id, allowed, { new: true });
    return Response.json(produce);
  } catch (err) {
    return Response.json({ error: "Failed to update produce" }, { status: 500 });
  }
}

export async function DELETE(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;

    const auth = getAuth(request);
    if (!auth) return Response.json({ error: "Authentication required" }, { status: 401 });

    const existing = await Produce.findById(params.id);
    if (!existing) return Response.json({ error: "Produce not found" }, { status: 404 });

    if (auth.role !== "admin" && auth.farmerId !== existing.farmerId?.toString()) {
      return Response.json({ error: "You can only remove your own produce" }, { status: 403 });
    }

    await Produce.findByIdAndUpdate(params.id, { available: false });
    return Response.json({ success: true, message: "Produce removed" });
  } catch (err) {
    return Response.json({ error: "Failed to delete produce" }, { status: 500 });
  }
}
