import crypto from "crypto";
import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
      await request.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    await connectDB();

    if (isValid) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        orderStatus: "confirmed",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });
      return Response.json({ success: true, message: "Payment verified" });
    } else {
      await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
      return Response.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (err) {
    return Response.json({ error: "Verification error" }, { status: 500 });
  }
}
