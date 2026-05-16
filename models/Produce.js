import mongoose from "mongoose";

const ProduceSchema = new mongoose.Schema(
  {
    farmerId:    { type: String, required: true },
    farmerName:  { type: String, required: true },
    village:     String,
    name:        { type: String, required: true },
    category:    { type: String, required: true },
    quantity:    { type: Number, required: true },
    unit:        { type: String, required: true },
    price:       { type: Number, required: true },
    harvestDate: String,
    organic:     { type: Boolean, default: false },
    description: { type: String, default: "" },
    emoji:       { type: String, default: "🌱" },
    available:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Produce || mongoose.model("Produce", ProduceSchema);
