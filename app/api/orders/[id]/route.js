import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;
    const order = await Order.findById(params.id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json(order);
  } catch (err) {
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request, { params: rawParams }) {
  try {
    await connectDB();
    const params = await rawParams;
    const body = await request.json();
    const allowed = {};
    if (body.orderStatus) allowed.orderStatus = body.orderStatus;
    if (body.paymentStatus) allowed.paymentStatus = body.paymentStatus;
    if (body.razorpayOrderId) allowed.razorpayOrderId = body.razorpayOrderId;
    if (body.razorpayPaymentId) allowed.razorpayPaymentId = body.razorpayPaymentId;
    if (body.razorpaySignature) allowed.razorpaySignature = body.razorpaySignature;
    if (body.paymentMethod) allowed.paymentMethod = body.paymentMethod;
    const order = await Order.findByIdAndUpdate(params.id, allowed, { new: true });
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    return Response.json(order);
  } catch (err) {
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}
