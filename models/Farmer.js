import mongoose from "mongoose";

const FarmerSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    village:  { type: String, required: true },
    district: { type: String, default: "" },
    state:    { type: String, default: "Karnataka" },
    phone:    { type: String, default: "" },
    crops:    [String],
    joined:   { type: String, default: () => new Date().toISOString().slice(0, 10) },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);
