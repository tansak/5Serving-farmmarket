"use client";
import { useState, useEffect } from "react";
import { NavBar, Btn, FormGroup, Input, Select, Textarea, Divider } from "@/components/ui";

const PAYMENT_OPTIONS = [
  {
    id: "razorpay",
    icon: "💳",
    label: "Pay Online — UPI / Card / NetBanking",
    sub: "Instant confirmation. Powered by Razorpay.",
    badge: "Recommended",
  },
  {
    id: "upi",
    icon: "📱",
    label: "Pay via UPI",
    sub: "Scan QR or pay to: 5serving@upi",
    note: "Share screenshot after payment",
  },
  {
    id: "cod",
    icon: "💵",
    label: "Cash on Delivery",
    sub: "Pay when your produce arrives",
    note: "Available within 30km of farm",
  },
];

export default function CheckoutScreen({ cart, onBack, onOrderPlaced, showToast, buyerPhone }) {
  const [form, setForm] = useState({ name: "", phone: buyerPhone || "", address: "", community: "", notes: "" });
  const [payment, setPayment] = useState("razorpay");
  const [communities, setCommunities] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(!!buyerPhone);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalPaise = Math.round(total * 100);

  useEffect(() => {
    fetch("/api/communities").then(r => r.json()).then(d => Array.isArray(d) && setCommunities(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!buyerPhone) return;
    setProfileLoading(true);
    fetch(`/api/buyers?phone=${buyerPhone}`)
      .then(r => r.json())
      .then(profile => {
        if (profile?.name) {
          setForm(f => ({
            ...f,
            phone: buyerPhone,
            name: profile.name || f.name,
            address: profile.address || f.address,
            community: profile.community || f.community,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [buyerPhone]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveBuyerProfile = () => {
    if (!form.phone) return;
    fetch("/api/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, name: form.name, address: form.address, community: form.community }),
    }).catch(() => {});
  };

  const loadRazorpay = () => new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handlePlaceOrder = async () => {
    if (!form.name || !form.phone || !form.address) {
      showToast?.("Please fill all required fields", "error"); return;
    }
    setPlacing(true);
    try {
      /* 1. Create order record */
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: form.name,
          buyerPhone: form.phone,
          buyerAddress: form.address,
          community: form.community,
          notes: form.notes,
          items: cart.map(i => ({
            produceId: i._id || i.id,
            produceName: i.name,
            farmerId: i.farmerId,
            farmerName: i.farmerName,
            emoji: i.emoji,
            qty: i.qty,
            unit: i.unit,
            price: i.price,
            subtotal: i.price * i.qty,
          })),
          totalAmount: total,
          paymentMethod: payment,
          paymentStatus: "pending",
        })
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      const order = await orderRes.json();

      if (payment === "razorpay") {
        /* 2a. Create Razorpay order */
        const rzpRes = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalPaise, receipt: order.orderNumber })
        });
        if (!rzpRes.ok) throw new Error("Payment setup failed");
        const { orderId: rzpOrderId } = await rzpRes.json();

        /* 2b. Load Razorpay checkout */
        const loaded = await loadRazorpay();
        if (!loaded) throw new Error("Razorpay script failed to load");

        await new Promise((resolve, reject) => {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: totalPaise,
            currency: "INR",
            name: "5serving FarmMarket",
            description: "Farm fresh produce order",
            order_id: rzpOrderId,
            prefill: { name: form.name, contact: form.phone },
            theme: { color: "#1B4332" },
            handler: async (response) => {
              try {
                const verifyRes = await fetch("/api/payment/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderId: order._id,
                  })
                });
                const vData = await verifyRes.json();
                if (vData.success) {
                  saveBuyerProfile();
                  resolve();
                  onOrderPlaced({ ...order, paymentMethod: "razorpay", paymentStatus: "paid" });
                } else {
                  reject(new Error("Payment verification failed"));
                }
              } catch (err) {
                reject(err);
              }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled")) }
          });
          rzp.open();
        });

      } else if (payment === "cod") {
        await fetch("/api/payment/cod", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order._id })
        });
        saveBuyerProfile();
        onOrderPlaced({ ...order, paymentMethod: "cod", paymentStatus: "pending" });

      } else {
        // UPI — mark pending, manual verification
        await fetch(`/api/orders/${order._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: "upi", paymentStatus: "pending" })
        });
        saveBuyerProfile();
        onOrderPlaced({ ...order, paymentMethod: "upi", paymentStatus: "pending" });
      }
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        showToast?.(err.message || "Order failed. Please try again.", "error");
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title="Checkout" sub={`${cart.length} items · ₹${total.toFixed(0)}`} onBack={onBack} />

      <div style={{ padding: 16 }}>

        {/* Step 1 — Buyer details */}
        <div style={{ marginBottom: 4 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--brown)", marginBottom: 16 }}>
            1. Your Details
          </h2>

          {profileLoading && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Loading your saved details…</div>
          )}
          {!profileLoading && buyerPhone && form.name && (
            <div style={{
              background: "var(--gs)", borderRadius: "var(--r-sm)", padding: "8px 12px",
              fontSize: 12, color: "var(--gd)", fontWeight: 600, marginBottom: 12
            }}>
              ✓ Details loaded from your profile — update if needed
            </div>
          )}

          <FormGroup label="Full Name *">
            <Input placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} />
          </FormGroup>
          <FormGroup label="Phone *">
            <Input type="tel" placeholder="10-digit mobile" value={form.phone} onChange={e => set("phone", e.target.value)} />
          </FormGroup>
          <FormGroup label="Delivery Address *">
            <Textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full delivery address" rows={3} />
          </FormGroup>
          <FormGroup label="Community (optional)">
            <Select value={form.community} onChange={e => set("community", e.target.value)}>
              <option value="">Select community…</option>
              {communities.map(c => (
                <option key={c._id} value={c.name}>{c.name} — {c.location}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Order Notes (optional)">
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any special instructions…" rows={2} />
          </FormGroup>
        </div>

        <Divider />

        {/* Step 2 — Payment */}
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--brown)", marginBottom: 16 }}>
          2. Payment Method
        </h2>

        {PAYMENT_OPTIONS.map(opt => (
          <div
            key={opt.id}
            onClick={() => setPayment(opt.id)}
            style={{
              background: "#fff", borderRadius: "var(--r)", marginBottom: 10,
              border: `2px solid ${payment === opt.id ? "var(--gd)" : "var(--border)"}`,
              padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start",
              boxShadow: payment === opt.id ? "0 0 0 3px var(--gs)" : "var(--shadow)",
              transition: "all .15s"
            }}
          >
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--brown)" }}>{opt.label}</span>
                {opt.badge && (
                  <span style={{
                    background: "var(--gs)", color: "var(--gd)", fontSize: 10,
                    fontWeight: 700, padding: "2px 8px", borderRadius: 10
                  }}>{opt.badge}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{opt.sub}</div>
              {opt.note && <div style={{ fontSize: 11, color: "var(--brown-l)", marginTop: 2 }}>{opt.note}</div>}
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", border: `2px solid ${payment === opt.id ? "var(--gd)" : "var(--border)"}`,
              background: payment === opt.id ? "var(--gd)" : "#fff", flexShrink: 0, marginTop: 2,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              {payment === opt.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
            </div>
          </div>
        ))}

        <Divider />

        {/* Step 3 — Place order */}
        <div style={{
          background: "var(--gs)", borderRadius: "var(--r)", padding: "14px 16px", marginBottom: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18 }}>
            <span>Total to Pay</span>
            <span style={{ color: "var(--terra)" }}>₹{total.toFixed(0)}</span>
          </div>
        </div>

        <Btn block onClick={handlePlaceOrder} loading={placing} style={{ fontSize: 16, padding: "14px 0" }}>
          Place Order →
        </Btn>
      </div>
    </div>
  );
}
