"use client";
import { NavBar, Btn, EmptyState, AIPanel, Divider } from "@/components/ui";

export default function CartScreen({ cart, onBack, onRemoveItem, onUpdateQty, onCheckout }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title="Your Cart" sub={`${cart.length} item${cart.length !== 1 ? "s" : ""}`} onBack={onBack} />

      <div style={{ padding: 16 }}>
        {cart.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            sub="Browse the marketplace and add fresh produce."
            action={onBack}
            actionLabel="Browse Market"
          />
        ) : (
          <>
            {cart.map(item => {
              const itemId = item._id || item.id;
              return (
                <div key={itemId} style={{
                  background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
                  padding: 14, marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start"
                }}>
                  <div style={{
                    width: 52, height: 52, background: item.organic ? "var(--gs)" : "var(--parch)",
                    borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, flexShrink: 0
                  }}>{item.emoji || "🌱"}</div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brown)", marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                      {item.farmerName} · ₹{item.price}/{item.unit}
                    </div>

                    {/* Qty stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        onClick={() => onUpdateQty(itemId, Math.max(1, item.qty - 1))}
                        disabled={item.qty <= 1}
                        style={{
                          width: 36, height: 36, borderRadius: "50%", background: "var(--parch)",
                          border: "1.5px solid var(--border)", cursor: item.qty <= 1 ? "default" : "pointer",
                          fontWeight: 700, fontSize: 18,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: item.qty <= 1 ? 0.3 : 1, transition: "opacity .15s"
                        }}
                      >−</button>
                      <span style={{ fontWeight: 700, fontSize: 16, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => onUpdateQty(itemId, item.qty + 1)} style={{
                        width: 36, height: 36, borderRadius: "50%", background: "var(--gs)",
                        border: "1.5px solid var(--gl)", cursor: "pointer", fontWeight: 700, fontSize: 18, color: "var(--gd)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>+</button>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{item.unit}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--terra)", fontSize: 15, marginBottom: 8 }}>
                      ₹{(item.price * item.qty).toFixed(0)}
                    </div>
                    <button onClick={() => onRemoveItem(itemId)} style={{
                      background: "var(--terra-s)", border: "none", color: "var(--terra)",
                      borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, fontFamily: "'Nunito', sans-serif"
                    }}>Remove</button>
                  </div>
                </div>
              );
            })}

            {/* Order summary */}
            <div style={{ background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)", padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 12 }}>Order Summary</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{total.toFixed(0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--muted)" }}>Platform fee</span>
                <span style={{ fontWeight: 600, color: "var(--gd)" }}>₹0 (Free!)</span>
              </div>
              <Divider style={{ margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: "var(--terra)" }}>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Impact panel */}
            <AIPanel
              title="5serving Impact"
              body="100% of your payment goes directly to farmers. No middlemen, no markup — just fair farm-to-table pricing."
            />

            <Btn block onClick={onCheckout} style={{ marginTop: 16, padding: "14px 28px", fontSize: 16 }}>
              Proceed to Checkout →
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}
