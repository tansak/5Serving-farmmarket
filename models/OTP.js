import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    phone:     { type: String, required: true },
    code:      { type: String, required: true },
    role:      { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired OTP documents
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);
