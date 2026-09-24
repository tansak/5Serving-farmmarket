"use client";
import { useState } from "react";
import { NavBar, Btn, FormGroup, Input, Select, Textarea, Badge, AIPanel } from "@/components/ui";
import { authHeaders } from "@/lib/clientAuth";
import { getProduceEmoji } from "@/lib/produceEmoji";

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Pulses", "Dairy", "Herbs", "Spices", "Roots"];
const UNITS = ["kg", "g", "litre", "dozen", "bundle", "bag", "piece"];

export default function AddProduceScreen({ farmers, initialFarmerId, currentFarmer, onSave, onBack, showToast }) {
  const [form, setForm] = useState({
    farmerId: currentFarmer?._id || initialFarmerId || farmers[0]?._id || "",
    name: "", category: "Vegetables", unit: "kg",
    quantity: "", price: "", harvestDate: "", organic: false, description: ""
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedFarmer = farmers.find(f => (f._id || f.id) === form.farmerId);

  const handleAIDescribe = async () => {
    if (!form.name) { showToast?.("Enter produce name first", "error"); return; }
    setAiLoading(true);
    try {
      const prompt = `Write a 2-sentence warm marketplace description (under 60 words) for: "${form.name}", category: ${form.category}, ${form.organic ? "organically grown" : "conventionally grown"}, from farmer ${selectedFarmer?.name || "a local farmer"} in ${selectedFarmer?.village || "Karnataka"}, for the 5serving FarmMarket initiative. Be warm, practical, and mention the Indian context.`;
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, system: "You are a warm copywriter for 5serving FarmMarket, an Indian farmers marketplace. Keep text short, warm, and grounded." }) });
      const data = await res.json();
      set("description", data.text);
    } catch {
      showToast?.("AI unavailable right now", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.price) {
      showToast?.("Name, quantity, and price are required", "error"); return;
    }
    setSaving(true);
    try {
      const farmer = farmers.find(f => (f._id || f.id) === form.farmerId);
      const body = {
        ...form,
        quantity: Number(form.quantity),
        price: Number(form.price),
        farmerName: farmer?.name || "",
        village: `${farmer?.district || ""}, ${farmer?.state || ""}`,
        emoji: getProduceEmoji(form.name, form.category),
      };
      const res = await fetch("/api/produce", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      showToast?.("✓ Produce listed!");
      onSave?.();
    } catch {
      showToast?.("Failed to save produce", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title="Add Produce" sub="List your harvest" onBack={onBack} />

      <div style={{ padding: 16 }}>

        {/* Farmer selector — hidden when a specific farmer is logged in */}
        {!currentFarmer && farmers.length > 1 && (
          <FormGroup label="Farmer">
            <Select value={form.farmerId} onChange={e => set("farmerId", e.target.value)}>
              {farmers.map(f => (
                <option key={f._id || f.id} value={f._id || f.id}>{f.name}</option>
              ))}
            </Select>
          </FormGroup>
        )}

        <FormGroup label="Produce Name *">
          <Input placeholder="e.g. Country Tomatoes" value={form.name} onChange={e => set("name", e.target.value)} />
        </FormGroup>

        <div style={{
          background: "var(--gs)", borderRadius: "var(--r-sm)", padding: "8px 12px",
          fontSize: 12, color: "var(--brown)", marginBottom: 16, lineHeight: 1.5
        }}>
          📸 No photo needed — just pick a category below and we'll show a picture for your produce automatically.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormGroup label="Category">
            <Select value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Unit">
            <Select value={form.unit} onChange={e => set("unit", e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </Select>
          </FormGroup>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormGroup label="Quantity *">
            <Input type="number" placeholder="50" value={form.quantity} onChange={e => set("quantity", e.target.value)} />
          </FormGroup>
          <FormGroup label="Price per unit (₹) *">
            <Input type="number" placeholder="28" value={form.price} onChange={e => set("price", e.target.value)} />
          </FormGroup>
        </div>

        <FormGroup label="Harvest Date">
          <Input type="date" value={form.harvestDate} onChange={e => set("harvestDate", e.target.value)} />
        </FormGroup>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
          <input type="checkbox" checked={form.organic} onChange={e => set("organic", e.target.checked)} style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14, color: "var(--brown)", fontWeight: 600 }}>🌿 This produce is organically grown</span>
        </label>

        <FormGroup label="Description">
          <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe your produce…" rows={3} />
        </FormGroup>

        <Btn variant="ai" block onClick={handleAIDescribe} loading={aiLoading} style={{ marginBottom: 8 }}>
          ✨ AI Describe
        </Btn>

        {/* Live preview */}
        {form.name && (
          <div style={{
            background: "var(--parch)", borderRadius: "var(--r)",
            padding: 14, marginTop: 16, marginBottom: 16
          }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>Live Preview</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: form.organic ? "var(--gs)" : "var(--parch)",
                border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28
              }}>{getProduceEmoji(form.name, form.category)}</div>
              <div>
                <div style={{ fontWeight: 700, color: "var(--brown)" }}>{form.name}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={{ color: "var(--terra)", fontWeight: 700 }}>₹{form.price}/{form.unit}</span>
                  {form.organic && <Badge variant="green" style={{ fontSize: 10 }}>Organic</Badge>}
                </div>
              </div>
            </div>
          </div>
        )}

        <Btn block onClick={handleSave} loading={saving}>Save Produce Listing</Btn>
      </div>
    </div>
  );
}
