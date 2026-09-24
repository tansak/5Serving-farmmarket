import connectDB from "@/lib/mongoose";
import Order from "@/models/Order";

function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSV(row[h])).join(","));
  }
  return lines.join("\r\n");
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get("farmerId");
    const farmerName = searchParams.get("farmerName");

    // Fetch all non-cancelled orders
    const allOrders = await Order.find({ orderStatus: { $ne: "cancelled" } })
      .sort({ createdAt: -1 });

    // Filter orders that contain this farmer's items
    const relevantOrders = farmerId || farmerName
      ? allOrders.filter(order =>
          order.items.some(item =>
            (farmerId && item.farmerId === farmerId) ||
            (farmerName && item.farmerName === farmerName)
          )
        )
      : allOrders;

    // Flatten to one row per order-item
    const rows = [];
    for (const order of relevantOrders) {
      const myItems = farmerId || farmerName
        ? order.items.filter(item =>
            (farmerId && item.farmerId === farmerId) ||
            (farmerName && item.farmerName === farmerName)
          )
        : order.items;

      for (const item of myItems) {
        rows.push({
          "Order Number":    order.orderNumber,
          "Date":            new Date(order.createdAt).toLocaleDateString("en-IN"),
          "Buyer Name":      order.buyerName,
          "Buyer Phone":     order.buyerPhone,
          "Delivery Address":order.buyerAddress,
          "Community":       order.community || "",
          "Produce":         item.produceName,
          "Qty":             item.qty,
          "Unit":            item.unit,
          "Price (₹)":       item.price,
          "Subtotal (₹)":    item.subtotal,
          "Payment Method":  order.paymentMethod,
          "Payment Status":  order.paymentStatus,
          "Order Status":    order.orderStatus,
          "Notes":           order.notes || "",
        });
      }
    }

    const headers = [
      "Order Number", "Date", "Buyer Name", "Buyer Phone", "Delivery Address",
      "Community", "Produce", "Qty", "Unit", "Price (₹)", "Subtotal (₹)",
      "Payment Method", "Payment Status", "Order Status", "Notes",
    ];

    const csv = toCSV(rows, headers);
    const filename = farmerId || farmerName
      ? `5serving-orders-${farmerName || farmerId}.csv`
      : "5serving-all-orders.csv";

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return Response.json({ error: "Export failed" }, { status: 500 });
  }
}
