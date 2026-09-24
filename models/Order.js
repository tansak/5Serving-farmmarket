import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderNumber:    { type: String, required: true, unique: true },
    buyerName:      { type: String, required: true },
    buyerPhone:     { type: String, required: true },
    buyerAddress:   { type: String, required: true },
    community:      { type: String, default: "" },
    items: [
      {
        produceId:   String,
        produceName: String,
        farmerName:  String,
        farmerId:    String,
        emoji:       String,
        qty:         Number,
        unit:        String,
        price:       Number,
        subtotal:    Number,
      },
    ],
    totalAmount:    { type: Number, required: true },
    paymentMethod:  { type: String, enum: ["razorpay", "cod", "upi"], required: true },
    paymentStatus:  { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    orderStatus:    { type: String, enum: ["placed", "confirmed", "dispatched", "delivered", "cancelled"], default: "placed" },
    notes:          { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
