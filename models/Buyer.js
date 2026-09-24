import mongoose from "mongoose";

const BuyerSchema = new mongoose.Schema(
  {
    phone:     { type: String, required: true, unique: true },
    name:      { type: String, default: "" },
    address:   { type: String, default: "" },
    community: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.Buyer || mongoose.model("Buyer", BuyerSchema);
