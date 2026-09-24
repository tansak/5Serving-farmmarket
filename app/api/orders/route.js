import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";
import Produce from "@/models/Produce";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const filter = {};
    if (searchParams.get("status")) filter.orderStatus = searchParams.get("status");
    if (searchParams.get("farmerId")) filter["items.farmerId"] = searchParams.get("farmerId");
    if (searchParams.get("farmerName")) filter["items.farmerName"] = searchParams.get("farmerName");
    if (searchParams.get("phone")) filter.buyerPhone = searchParams.get("phone");
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

    // Decrement produce quantities for each ordered item
    for (const item of (body.items || [])) {
      if (item.produceId) {
        await Produce.findByIdAndUpdate(
          item.produceId,
          { $inc: { quantity: -item.qty } }
        ).catch(() => {}); // don't fail order if decrement fails
      }
    }

    return Response.json(order, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
