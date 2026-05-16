import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get("status")) filter.orderStatus = searchParams.get("status");
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return Response.json(orders);
  } catch (err) {
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    body.orderNumber = "5SF" + Date.now();
    const order = await Order.create(body);
    return Response.json(order, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
