"use client";
import { useState } from "react";
import { NavBar, Card, Badge, Btn, Divider } from "@/components/ui";
import { authHeaders } from "@/lib/clientAuth";

export default function FarmerProduceDetail({ produce, onBack, onEdit, showToast, onUpdate }) {
  const [available, setAvailable] = useState(produce.available);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const id = produce._id || produce.id;
      const res = await fetch(`/api/produce/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ available: !available })
      });
      if (!res.ok) throw new Error();
      setAvailable(v => !v);
      showToast?.(!available ? "✓ Produce marked available" : "Produce hidden from marketplace");
      onUpdate?.({ ...produce, available: !available });
    } catch {
      showToast?.("Failed to update", "error");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <NavBar title={produce.name} sub={produce.farmerName} onBack={onBack} />

      <div style={{ padding: 16 }}>
        {/* Emoji display */}
        <div style={{
          background: produce.organic ? "var(--gs)" : "var(--parch)",
          borderRadius: "var(--r)", padding: "32px 0", textAlign: "center",
          fontSize: 72, marginBottom: 16
        }}>{produce.emoji || "🌱"}</div>

        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "var(--brown)" }}>{produce.name}</h2>
            <div style={{ display: "flex", gap: 6 }}>
              {produce.organic && <Badge variant="green">Organic</Badge>}
              <Badge variant={available ? "green" : "terra"}>{available ? "Available" : "Hidden"}</Badge>
            </div>
          </div>

          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
            📍 {produce.village} · {produce.farmerName}
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>QUANTITY</div>
              <div style={{ fontWeight: 700 }}>{produce.quantity} {produce.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>PRICE</div>
              <div style={{ fontWeight: 700, color: "var(--terra)", fontSize: 18 }}>₹{produce.price}/{produce.unit}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>CATEGORY</div>
              <div style={{ fontWeight: 700 }}>{produce.category}</div>
            </div>
          </div>

          {produce.harvestDate && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              🗓 Harvested: {new Date(produce.harvestDate).toLocaleDateString("en-IN")}
            </div>
          )}

          {produce.description && (
            <>
              <Divider />
              <p style={{ fontSize: 14, color: "var(--brown)", lineHeight: 1.6 }}>{produce.description}</p>
            </>
          )}
        </Card>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Btn variant={available ? "terra" : "primary"} block onClick={handleToggle} loading={toggling}>
            {available ? "Hide from Marketplace" : "Mark as Available"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
