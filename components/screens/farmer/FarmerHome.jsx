"use client";
import { useState } from "react";
import { NavBar, Card, Badge, Btn, EmptyState, Divider } from "@/components/ui";

const CATEGORY_EMOJI = {
  Vegetables: "🥦", Fruits: "🍎", Grains: "🌾", Pulses: "🫘",
  Dairy: "🥛", Herbs: "🌿", Spices: "🌶️", Roots: "🥕"
};

export default function FarmerHome({ farmers, produce, onNav }) {
  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0]?._id || "");

  const selectedFarmer = farmers.find(f => f._id === selectedFarmerId || f.id === selectedFarmerId);
  const myProduce = produce.filter(p => p.farmerId === selectedFarmerId || p.farmerId === (selectedFarmer?._id));

  return (
    <div style={{ paddingBottom: 80 }}>
      <NavBar title="Farmer Portal" sub="5serving FarmMarket" />

      <div style={{ padding: "16px 16px 0" }}>
        {/* Farmer selector */}
        <select
          value={selectedFarmerId}
          onChange={e => setSelectedFarmerId(e.target.value)}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)",
            border: "1.5px solid var(--border)", background: "#fff", fontSize: 14,
            fontFamily: "'Nunito', sans-serif", marginBottom: 16
          }}
        >
          <option value="">Select Farmer…</option>
          {farmers.map(f => (
            <option key={f._id || f.id} value={f._id || f.id}>
              {f.name} — {f.village}
            </option>
          ))}
        </select>

        {/* Farmer info card */}
        {selectedFarmer && (
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "var(--gs)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28
              }}>👨‍🌾</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, color: "var(--brown)" }}>
                  {selectedFarmer.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {selectedFarmer.village}, {selectedFarmer.district}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  <Badge variant="brown">{myProduce.length} listings</Badge>
                  {selectedFarmer.crops?.map(c => (
                    <Badge key={c} variant="green">{c}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* My Produce section */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--brown)" }}>My Produce</h2>
          <Btn size="sm" onClick={() => onNav("add-produce", { farmerId: selectedFarmerId })}>+ Add Produce</Btn>
        </div>

        {myProduce.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="No produce listed yet"
            sub="Start listing your farm's produce to reach buyers."
            action={() => onNav("add-produce", { farmerId: selectedFarmerId })}
            actionLabel="Add First Produce"
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {myProduce.map(item => (
              <Card
                key={item._id || item.id}
                hover
                onClick={() => onNav("farmer-produce-detail", { produce: item })}
                style={{ cursor: "pointer" }}
              >
                <div style={{
                  background: item.organic ? "var(--gs)" : "var(--parch)",
                  borderRadius: "var(--r-sm)", padding: "14px 0",
                  textAlign: "center", fontSize: 36, marginBottom: 10
                }}>
                  {item.emoji || CATEGORY_EMOJI[item.category] || "🌱"}
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)", marginBottom: 2, lineHeight: 1.3 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                  {item.quantity} {item.unit}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, color: "var(--terra)", fontSize: 14 }}>₹{item.price}/{item.unit}</span>
                  {item.organic && <Badge variant="green" style={{ fontSize: 9 }}>Organic</Badge>}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Divider style={{ margin: "24px 0 16px" }} />
        <Btn variant="outline" block onClick={() => onNav("add-farmer", {})}>
          + Register New Farmer
        </Btn>
      </div>
    </div>
  );
}
