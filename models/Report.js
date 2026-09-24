import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    category:    { type: String, enum: ["Bug", "Wrong Info", "Suggestion", "Other"], default: "Bug" },
    description: { type: String, required: true },
    role:        { type: String, default: "" },
    phone:       { type: String, default: "" },
    status:      { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
