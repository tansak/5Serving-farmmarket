import connectDB from "@/lib/mongoose";
import OTP from "@/models/OTP";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phone, code) {
  const apiKey = (process.env.FAST2SMS_API_KEY || "").replace(/﻿/g, "").replace(/\n/g, "").trim();
  if (!apiKey) return { sent: false, reason: "no_key" };

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: code,
        numbers: phone,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.return === true) return { sent: true };
    return { sent: false, reason: data.message || JSON.stringify(data) };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

export async function POST(request) {
  try {
    const { phone, role } = await request.json();

    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return Response.json({ error: "Valid 10-digit mobile number required" }, { status: 400 });
    }

    await connectDB();

    // Rate limit: one OTP request per 60 seconds per phone+role
    const recent = await OTP.findOne({
      phone: phone.trim(),
      role,
      used: false,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
    });
    if (recent) {
      return Response.json(
        { error: "Please wait 60 seconds before requesting another OTP" },
        { status: 429 }
      );
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ phone: phone.trim(), role, used: false });
    await OTP.create({ phone: phone.trim(), code, role, expiresAt });

    // Demo mode: skip SMS entirely and show OTP in the UI
    const demoMode = (process.env.DEMO_MODE || "").trim() === "true" || process.env.NODE_ENV !== "production";
    if (demoMode) {
      console.log(`[5serving OTP demo] Phone: ${phone}, Code: ${code}, Role: ${role}`);
      return Response.json({
        success: true,
        message: "Demo mode active — OTP shown below",
        demoOtp: code,
      });
    }

    const { sent, reason } = await sendSMS(phone.trim(), code);

    if (sent) {
      return Response.json({ success: true, message: "OTP sent to your mobile" });
    }

    console.error(`[5serving] SMS failed for ${phone}: ${reason}`);
    return Response.json(
      { error: "Could not send OTP via SMS. Please try again or contact support." },
      { status: 503 }
    );
  } catch (err) {
    return Response.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
