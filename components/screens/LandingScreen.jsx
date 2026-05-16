"use client";
import { useState, useEffect } from "react";

const roles = [
  { id: "farmer",    icon: "👨‍🌾", label: "I'm a Farmer",  sub: "List & manage my produce" },
  { id: "consumer",  icon: "🛒", label: "I'm a Buyer",    sub: "Browse & order fresh produce" },
  { id: "admin",     icon: "⚙️", label: "Admin",           sub: "Manage platform data" },
  { id: "community", icon: "🏘️", label: "Community",       sub: "Group orders for your colony" },
];

export default function LandingScreen({ onRole }) {
  const [counts, setCounts] = useState({ farmers: "…", produce: "…", communities: "…" });

  useEffect(() => {
    Promise.all([
      fetch("/api/farmers").then(r => r.json()),
      fetch("/api/produce").then(r => r.json()),
      fetch("/api/communities").then(r => r.json()),
    ]).then(([farmers, produce, communities]) => {
      setCounts({
        farmers: Array.isArray(farmers) ? farmers.length : "…",
        produce: Array.isArray(produce) ? produce.length : "…",
        communities: Array.isArray(communities) ? communities.length : "…",
      });
    }).catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(160deg, #1B4332, #2D6A4F, #52B788)",
        padding: "48px 24px 40px", textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        {/* Noise texture overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "16px 16px", pointerEvents: "none"
        }} />

        {/* Brand pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.15)", borderRadius: 30,
          padding: "5px 14px", fontSize: 13, color: "#fff", fontWeight: 600, marginBottom: 24
        }}>
          🌿 5serving · FarmMarket
          <span style={{ fontSize: 10, background: "rgba(255,255,255,.25)", borderRadius: 10, padding: "1px 7px", marginLeft: 4 }}>
            AI-First Farmers Marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: 40, color: "#fff", lineHeight: 1.15, marginBottom: 16, whiteSpace: "pre-line"
        }}>{"Farm Fresh.\nCommunity First."}</h1>

        <p style={{ color: "rgba(255,255,255,.85)", fontSize: 15, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 32px" }}>
          Connecting India's farmers with urban communities — fresh produce, zero middlemen, fair prices.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          {[
            { icon: "🌾", label: "Farmers Online", val: counts.farmers },
            { icon: "🥦", label: "Produce Listed", val: counts.produce },
            { icon: "🏘️", label: "Communities",    val: counts.communities },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)",
              borderRadius: 14, padding: "10px 16px", textAlign: "center", minWidth: 90
            }}>
              <div style={{ fontSize: 20 }}>{stat.icon}</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{stat.val}</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 10 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role selection */}
      <div style={{ padding: "32px 20px 20px" }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", textAlign: "center",
          color: "var(--brown)", fontSize: 22, marginBottom: 20
        }}>Who are you today?</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => onRole(role.id)}
              style={{
                background: "#fff", border: "2px solid var(--border)", borderRadius: "var(--r)",
                padding: "20px 12px", textAlign: "center", cursor: "pointer",
                boxShadow: "var(--shadow)", transition: "border-color .2s, transform .2s",
                fontFamily: "'Nunito', sans-serif"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gd)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>{role.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brown)", marginBottom: 4 }}>{role.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{role.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: "var(--gd)", color: "#fff", textAlign: "center",
        padding: "24px 20px", marginTop: 32
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          The 5serving Promise
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Farmers · Families · Community · Planet · Health
        </div>
      </div>
    </div>
  );
}
