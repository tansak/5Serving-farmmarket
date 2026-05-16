"use client";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Pulses", "Dairy", "Herbs", "Spices", "Roots"];
const CATEGORY_EMOJI = {
  Vegetables: "🥦", Fruits: "🍎", Grains: "🌾", Pulses: "🫘",
  Dairy: "🥛", Herbs: "🌿", Spices: "🌶️", Roots: "🥕"
};

export default function ConsumerHome({ produce, cart, onSelectProduce }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [organicOnly, setOrganicOnly] = useState(false);

  const filtered = useMemo(() => produce.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.farmerName?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchOrganic = !organicOnly || p.organic;
    return matchSearch && matchCat && matchOrganic;
  }), [produce, search, category, organicOnly]);

  return (
    <div style={{ paddingBottom: 90 }}>

      {/* Hero strip */}
      <div style={{
        background: "linear-gradient(135deg, var(--gd), var(--gm))",
        padding: "20px 16px 24px", color: "#fff"
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Today's Harvest 🌾
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
          Fresh from Karnataka, Maharashtra & Tamil Nadu farms
        </div>

        {/* Search */}
        <div style={{
          background: "#fff", borderRadius: 30,
          display: "flex", alignItems: "center", padding: "0 16px", gap: 8
        }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <input
            placeholder="Search produce or farmer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: "none", outline: "none", padding: "12px 0",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, background: "transparent", color: "var(--ink)"
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--muted)" }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>

        {/* Category chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, fontSize: 13,
                fontWeight: 600, border: "1.5px solid", cursor: "pointer",
                borderColor: category === cat ? "var(--gd)" : "var(--border)",
                background: category === cat ? "var(--gs)" : "#fff",
                color: category === cat ? "var(--gd)" : "var(--muted)",
                fontFamily: "'Nunito', sans-serif", transition: "all .15s"
              }}
            >{cat}</button>
          ))}
        </div>

        {/* Organic toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", cursor: "pointer" }}>
          <input type="checkbox" checked={organicOnly} onChange={e => setOrganicOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>🌿 Organic only</span>
        </label>

        {/* Results count */}
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          {filtered.length} item{filtered.length !== 1 ? "s" : ""} available
        </div>

        {/* Produce grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No produce found</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {filtered.map(item => (
              <div
                key={item._id || item.id}
                onClick={() => onSelectProduce(item)}
                style={{
                  background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
                  cursor: "pointer", overflow: "hidden",
                  transition: "transform .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
              >
                <div style={{
                  background: item.organic ? "var(--gs)" : "var(--parch)",
                  padding: "18px 0", textAlign: "center", fontSize: 40
                }}>
                  {item.emoji || CATEGORY_EMOJI[item.category] || "🌱"}
                </div>
                <div style={{ padding: "10px 10px 12px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)", marginBottom: 2, lineHeight: 1.3 }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>
                    {item.farmerName}
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    <Badge variant="brown" style={{ fontSize: 9 }}>{item.category}</Badge>
                    {item.organic && <Badge variant="green" style={{ fontSize: 9 }}>Organic</Badge>}
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--terra)", fontSize: 14 }}>
                    ₹{item.price}/{item.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
