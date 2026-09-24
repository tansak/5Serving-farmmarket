import connectDB from "@/lib/mongoose";
import OTP from "@/models/OTP";
import Farmer from "@/models/Farmer";
import { createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { phone, code, role } = await request.json();

    await connectDB();

    const record = await OTP.findOne({
      phone: phone.trim(),
      code: code.trim(),
      role,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return Response.json({ error: "Invalid or expired OTP. Please try again." }, { status: 400 });
    }

    record.used = true;
    await record.save();

    // Admin role: verify phone is authorized
    if (role === "admin") {
      const adminPhones = (process.env.ADMIN_PHONES || "")
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);
      if (adminPhones.length > 0 && !adminPhones.includes(phone.trim())) {
        return Response.json({ error: "This number is not authorized for admin access." }, { status: 403 });
      }
      if (adminPhones.length === 0) {
        console.warn("[5serving] ADMIN_PHONES not set — any phone can access admin. Set this in production.");
      }
      const token = createToken({ phone: phone.trim(), role: "admin", farmerId: null });
      return Response.json({ success: true, phone: phone.trim(), role: "admin", token });
    }

    let farmer = null;
    if (role === "farmer") {
      farmer = await Farmer.findOne({ phone: phone.trim(), active: true, status: "approved" });
      if (!farmer) {
        farmer = await Farmer.findOne({ phone: phone.trim(), active: true });
      }
    }

    const token = createToken({
      phone: phone.trim(),
      role,
      farmerId: farmer?._id?.toString() || null,
    });

    return Response.json({
      success: true,
      phone: phone.trim(),
      role,
      farmer,
      isNewUser: role === "farmer" && !farmer,
      token,
    });
  } catch (err) {
    return Response.json({ error: "OTP verification failed" }, { status: 500 });
  }
}
