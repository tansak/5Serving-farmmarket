import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    await connectDB();
    const { orderId } = await request.json();
    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "confirmed",
    });
    return Response.json({ success: true, message: "COD order confirmed" });
  } catch (err) {
    return Response.json({ error: "COD confirmation failed" }, { status: 500 });
  }
}
