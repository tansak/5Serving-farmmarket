"use client";
import { useState } from "react";
import { NavBar, Btn } from "@/components/ui";

const CATEGORIES = ["Bug", "Wrong Info", "Suggestion", "Other"];
const CATEGORY_ICON = { Bug: "🐛", "Wrong Info": "⚠️", Suggestion: "💡", Other: "📝" };

export default function ReportIssueScreen({ role, phone, onBack, showToast }) {
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      showToast?.("Please describe the issue", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, description, role, phone }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      showToast?.("Failed to submit. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🙏</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--brown)", fontSize: 24, marginBottom: 12 }}>
          Thank you!
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 280, marginBottom: 28 }}>
          Your report has been received. Our team will look into it and improve the app for everyone.
        </p>
        <Btn block onClick={onBack}>Back to App</Btn>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: 40 }}>
      <NavBar title="Report an Issue" sub="Help us improve 5serving" onBack={onBack} />

      <div style={{ padding: 16 }}>

        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>
            What type of issue?
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "12px 10px", borderRadius: "var(--r-sm)", border: "2px solid",
                  borderColor: category === cat ? "var(--gd)" : "var(--border)",
                  background: category === cat ? "var(--gs)" : "#fff",
                  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all .15s"
                }}
              >
                <span style={{ fontSize: 24 }}>{CATEGORY_ICON[cat]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: category === cat ? "var(--gd)" : "var(--muted)" }}>
                  {cat}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>
            Describe the issue *
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              category === "Bug"        ? "e.g. The app crashes when I tap Add to Cart..." :
              category === "Wrong Info" ? "e.g. The price shown for tomatoes is incorrect..." :
              category === "Suggestion" ? "e.g. It would be helpful if we could filter by district..." :
              "Tell us what's on your mind..."
            }
            rows={5}
            maxLength={500}
            style={{
              width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)",
              padding: "12px 14px", fontSize: 14, fontFamily: "'Nunito', sans-serif",
              outline: "none", color: "var(--brown)", background: "#fff",
              resize: "none", lineHeight: 1.6, boxSizing: "border-box"
            }}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", marginTop: 4 }}>
            {description.length}/500
          </div>
        </div>

        {/* Reporter info (read-only if logged in) */}
        {(role || phone) && (
          <div style={{
            background: "var(--gs)", borderRadius: "var(--r-sm)", padding: "10px 14px",
            marginBottom: 20, fontSize: 12, color: "var(--muted)", lineHeight: 1.8
          }}>
            <span style={{ fontWeight: 700, color: "var(--gd)" }}>Your details (auto-filled)</span><br />
            {role && <>Role: <strong style={{ color: "var(--brown)" }}>{role}</strong><br /></>}
            {phone && <>Phone: <strong style={{ color: "var(--brown)" }}>+91 {phone}</strong></>}
          </div>
        )}

        <Btn block onClick={handleSubmit} loading={submitting}>
          📢 Submit Report
        </Btn>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 16, lineHeight: 1.6 }}>
          Your feedback helps make 5serving better for every farmer and family.
        </p>
      </div>
    </div>
  );
}
