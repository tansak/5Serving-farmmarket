import connectDB from "@/lib/mongoose";
import Produce from "@/models/Produce";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const produce = await Produce.findById(params.id);
    if (!produce) return Response.json({ error: "Produce not found" }, { status: 404 });
    return Response.json(produce);
  } catch (err) {
    return Response.json({ error: "Failed to fetch produce" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const body = await request.json();
    const allowed = {};
    if (body.quantity !== undefined) allowed.quantity = body.quantity;
    if (body.price !== undefined) allowed.price = body.price;
    if (body.available !== undefined) allowed.available = body.available;
    if (body.description !== undefined) allowed.description = body.description;
    const produce = await Produce.findByIdAndUpdate(params.id, allowed, { new: true });
    if (!produce) return Response.json({ error: "Produce not found" }, { status: 404 });
    return Response.json(produce);
  } catch (err) {
    return Response.json({ error: "Failed to update produce" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await Produce.findByIdAndUpdate(params.id, { available: false });
    return Response.json({ success: true, message: "Produce removed" });
  } catch (err) {
    return Response.json({ error: "Failed to delete produce" }, { status: 500 });
  }
}
