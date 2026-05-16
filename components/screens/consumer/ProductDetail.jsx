"use client";
import { useState } from "react";
import { NavBar, Btn, Badge, Divider, AIPanel } from "@/components/ui";

function freshnessLabel(harvestDate) {
  if (!harvestDate) return null;
  const days = Math.floor((Date.now() - new Date(harvestDate).getTime()) / 86400000);
  if (days === 0) return { color: "#2D6A4F", label: "🟢 Harvested today" };
  if (days === 1) return { color: "#2D6A4F", label: "🟢 Yesterday" };
  if (days <= 3) return { color: "#B8860B", label: `🟡 ${days} days ago` };
  return { color: "#C84B2F", label: `🔴 ${days} days ago` };
}

export default function ProductDetail({ product, cart, onBack, onAddToCart, showToast }) {
  const [qty, setQty] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");

  const cartItem = cart?.find(c => (c._id || c.id) === (product._id || product.id));
  const freshness = freshnessLabel(product.harvestDate);

  const handleAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Give 2 practical nutrition or cooking tips (under 50 words total) for ${product.name} (${product.category}) in the Indian context. Be warm and practical.`,
          system: "You are a helpful nutrition assistant for 5serving FarmMarket, an Indian farmers marketplace. Keep responses concise and practical."
        })
      });
      const data = await res.json();
      setAiText(data.text);
    } catch {
      setAiText("Tips unavailable right now. Try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddToCart = () => {
    onAddToCart({ ...product, qty, subtotal: product.price * qty });
    showToast?.(`✓ ${product.name} added to cart`);
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title={product.name} sub={product.farmerName} onBack={onBack} />

      <div style={{ padding: 16 }}>
        {/* Emoji display */}
        <div style={{
          background: product.organic ? "var(--gs)" : "var(--parch)",
          borderRadius: "var(--r)", padding: "40px 0", textAlign: "center",
          fontSize: 80, marginBottom: 16, boxShadow: "var(--shadow)"
        }}>{product.emoji || "🌱"}</div>

        {/* Freshness badge */}
        {freshness && (
          <div style={{ marginBottom: 10 }}>
            <span style={{
              fontSize: 12, fontWeight: 700, color: freshness.color,
              background: "#fff", padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${freshness.color}30`
            }}>{freshness.label}</span>
          </div>
        )}

        {/* Name and badges */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--brown)", marginBottom: 4 }}>
          {product.name}
        </h1>
        <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
          👨‍🌾 {product.farmerName} · {product.village}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <Badge variant="brown">{product.category}</Badge>
          {product.organic && <Badge variant="green">🌿 Organic</Badge>}
        </div>

        {product.description && (
          <p style={{ fontSize: 14, color: "var(--brown)", lineHeight: 1.7, marginBottom: 16 }}>
            {product.description}
          </p>
        )}

        <Divider />

        {/* Price + qty stepper */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "var(--terra)", fontWeight: 700 }}>
            ₹{product.price}<span style={{ fontSize: 16, fontWeight: 400 }}>/{product.unit}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
              width: 34, height: 34, borderRadius: "50%", background: "var(--parch)",
              border: "1.5px solid var(--border)", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
            }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 18, minWidth: 24, textAlign: "center" }}>{qty}</span>
            <button onClick={() => setQty(q => Math.min(product.quantity, q + 1))} style={{
              width: 34, height: 34, borderRadius: "50%", background: "var(--gs)",
              border: "1.5px solid var(--gl)", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--gd)"
            }}>+</button>
          </div>
        </div>

        {/* Total + add to cart */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--gs)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: 16
        }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {qty} {product.unit} × ₹{product.price}
          </span>
          <span style={{ fontWeight: 700, color: "var(--gd)", fontSize: 16 }}>
            ₹{(qty * product.price).toFixed(0)} total
          </span>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          {product.quantity} {product.unit} available
        </div>

        <Btn block onClick={handleAddToCart} style={{ marginBottom: 20 }}>
          🛒 Add to Cart
        </Btn>

        <Divider />

        {/* AI Nutrition section */}
        <div style={{ marginTop: 4 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "var(--brown)", marginBottom: 8 }}>
            ✨ AI Nutrition Insight
          </div>
          {aiText ? (
            <AIPanel title="Nutrition Tips" body={aiText} />
          ) : (
            <div style={{
              background: "var(--gs)", borderRadius: "var(--r)",
              padding: "14px 16px", color: "var(--muted)", fontSize: 13, marginBottom: 12
            }}>
              Get personalised nutrition and cooking tips powered by Claude AI.
            </div>
          )}
          <Btn variant="ai" block onClick={handleAI} loading={aiLoading} style={{ marginTop: 8 }}>
            ✨ Get Tips
          </Btn>
        </div>
      </div>
    </div>
  );
}
