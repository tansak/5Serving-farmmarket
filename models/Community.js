import mongoose from "mongoose";

const CommunitySchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    location: { type: String, required: true },
    members:  { type: Number, default: 0 },
    type:     { type: String, default: "General" },
    active:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Community || mongoose.model("Community", CommunitySchema);
