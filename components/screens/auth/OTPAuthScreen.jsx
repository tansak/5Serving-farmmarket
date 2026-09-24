"use client";
import { useState, useRef, useEffect } from "react";
import { Btn, Spinner } from "@/components/ui";
import { setSessionToken } from "@/lib/clientAuth";

const ROLE_META = {
  farmer:    { icon: "👨‍🌾", label: "Farmer",    color: "var(--gd)" },
  consumer:  { icon: "🛒", label: "Buyer",     color: "var(--terra)" },
  community: { icon: "🏘️", label: "Community", color: "var(--gold)" },
  admin:     { icon: "⚙️", label: "Admin",     color: "var(--gd)" },
};

export default function OTPAuthScreen({ role, onVerified, onBack }) {
  const meta = ROLE_META[role] || ROLE_META.consumer;

  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOTP = async () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit mobile number"); return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
      setDemoOtp(data.demoOtp || "");
      setStep("otp");
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (!val && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOTPKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter all 6 digits"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid OTP"); return; }
      if (data.token) setSessionToken(data.token);
      onVerified({ phone: phone.trim(), farmer: data.farmer, isNewUser: data.isNewUser, token: data.token });
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--gd), var(--gm))",
        padding: "32px 24px 40px", textAlign: "center"
      }}>
        <button onClick={onBack} style={{
          position: "absolute", top: 16, left: 16,
          background: "rgba(255,255,255,.2)", border: "none", color: "#fff",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 16, fontFamily: "'Nunito', sans-serif"
        }}>← Back</button>

        <div style={{ fontSize: 52, marginBottom: 12 }}>{meta.icon}</div>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          {step === "phone" ? `Sign in as ${meta.label}` : "Verify your number"}
        </div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 14 }}>
          {step === "phone"
            ? "Enter your mobile number to continue"
            : `OTP sent to +91 ${phone}`}
        </div>
      </div>

      <div style={{ flex: 1, padding: "32px 24px" }}>

        {step === "phone" ? (
          <>
            <div style={{
              background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
              padding: 20, marginBottom: 20
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
                Mobile Number
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  padding: "10px 14px", background: "var(--parch)", borderRadius: "var(--r-sm)",
                  fontWeight: 700, fontSize: 14, color: "var(--brown)", whiteSpace: "nowrap"
                }}>🇮🇳 +91</div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                  style={{
                    flex: 1, border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
                    padding: "10px 14px", fontSize: 18, fontWeight: 700, letterSpacing: 2,
                    fontFamily: "'Nunito', sans-serif", outline: "none", color: "var(--ink)"
                  }}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div style={{ color: "var(--terra)", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>⚠ {error}</div>
            )}

            <Btn block onClick={handleSendOTP} loading={loading} style={{ fontSize: 16, padding: "14px 0" }}>
              Send OTP →
            </Btn>
          </>
        ) : (
          <>
            {/* Demo OTP banner */}
            {demoOtp && (
              <div style={{
                background: "var(--gold-s)", border: "1.5px solid var(--gold)",
                borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 10
              }}>
                <span style={{ fontSize: 20 }}>🧪</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>Demo Mode</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Your OTP is: <strong style={{ fontSize: 16, letterSpacing: 2 }}>{demoOtp}</strong>
                    <span style={{ display: "block", marginTop: 2, fontSize: 11 }}>
                      (In production, this will be sent via SMS)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* OTP boxes */}
            <div style={{
              background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
              padding: 24, marginBottom: 20, textAlign: "center"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 16 }}>
                Enter 6-digit OTP
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOTPChange(i, e.target.value)}
                    onKeyDown={e => handleOTPKeyDown(i, e)}
                    style={{
                      width: 44, height: 52, textAlign: "center", fontSize: 22, fontWeight: 700,
                      border: `2px solid ${digit ? "var(--gm)" : "var(--border)"}`,
                      borderRadius: "var(--r-sm)", fontFamily: "'Nunito', sans-serif",
                      outline: "none", color: "var(--ink)", background: digit ? "var(--gs)" : "#fff",
                      transition: "all .15s"
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: "var(--terra)", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>⚠ {error}</div>
            )}

            <Btn block onClick={handleVerify} loading={loading} style={{ fontSize: 16, padding: "14px 0", marginBottom: 12 }}>
              Verify OTP ✓
            </Btn>

            <div style={{ textAlign: "center", fontSize: 13 }}>
              {resendCooldown > 0 ? (
                <span style={{ color: "var(--muted)" }}>Resend OTP in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={() => { setOtp(["","","","","",""]); handleSendOTP(); }}
                  style={{
                    background: "none", border: "none", color: "var(--gd)",
                    fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Nunito', sans-serif"
                  }}
                >Resend OTP</button>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                style={{
                  background: "none", border: "none", color: "var(--muted)",
                  cursor: "pointer", fontSize: 12, fontFamily: "'Nunito', sans-serif"
                }}
              >← Change number</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
