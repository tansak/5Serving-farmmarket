import Razorpay from "razorpay";

export async function POST(request) {
  try {
    const { amount, currency, receipt, notes } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: currency || "INR",
      receipt,
      notes,
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    return Response.json({ error: "Payment order creation failed" }, { status: 500 });
  }
}
