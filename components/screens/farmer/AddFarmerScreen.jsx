"use client";
import { useState } from "react";
import { NavBar, Btn, FormGroup, Input, Select, Badge } from "@/components/ui";

const ALL_CROPS = ["Vegetables", "Fruits", "Grains", "Pulses", "Dairy", "Herbs", "Spices", "Roots"];

export default function AddFarmerScreen({ onSave, onBack, showToast }) {
  const [form, setForm] = useState({
    name: "", village: "", district: "", state: "Karnataka", phone: "", crops: []
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCrop = (crop) => {
    setForm(f => ({
      ...f,
      crops: f.crops.includes(crop) ? f.crops.filter(c => c !== crop) : [...f.crops, crop]
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.village) {
      showToast?.("Name and village are required", "error"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/farmers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error();
      const farmer = await res.json();
      showToast?.("✓ Farmer registered!");
      onSave?.(farmer);
    } catch {
      showToast?.("Failed to register farmer", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title="Register Farmer" sub="Join the 5serving network" onBack={onBack} />

      <div style={{ padding: 16 }}>
        <FormGroup label="Full Name *">
          <Input placeholder="e.g. Ramu Gowda" value={form.name} onChange={e => set("name", e.target.value)} />
        </FormGroup>

        <FormGroup label="Village / Town *">
          <Input placeholder="e.g. Channarayapatna" value={form.village} onChange={e => set("village", e.target.value)} />
        </FormGroup>

        <FormGroup label="District">
          <Input placeholder="e.g. Hassan" value={form.district} onChange={e => set("district", e.target.value)} />
        </FormGroup>

        <FormGroup label="State">
          <Select value={form.state} onChange={e => set("state", e.target.value)}>
            {["Karnataka", "Maharashtra", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Other"].map(s => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup label="Mobile Number">
          <Input type="tel" placeholder="10-digit number" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </FormGroup>

        <FormGroup label="Crops / Produce Types">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {ALL_CROPS.map(crop => (
              <button
                key={crop}
                onClick={() => toggleCrop(crop)}
                style={{
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", border: "1.5px solid",
                  borderColor: form.crops.includes(crop) ? "var(--gd)" : "var(--border)",
                  background: form.crops.includes(crop) ? "var(--gs)" : "#fff",
                  color: form.crops.includes(crop) ? "var(--gd)" : "var(--muted)",
                  transition: "all .15s", fontFamily: "'Nunito', sans-serif"
                }}
              >{crop}</button>
            ))}
          </div>
        </FormGroup>

        <Btn block onClick={handleSave} loading={saving} style={{ marginTop: 8 }}>
          Register Farmer
        </Btn>
      </div>
    </div>
  );
}
