"use client";
import { useState } from "react";
import { Btn, AIPanel, Divider } from "@/components/ui";

const STATUS_STEPS = ["placed", "confirmed", "dispatched", "delivered"];

function PaymentBadge({ method }) {
  const map = {
    razorpay: { bg: "var(--gs)", color: "var(--gd)", label: "💳 Payment Successful" },
    cod:      { bg: "var(--gold-s)", color: "#7A5A00", label: "💵 Cash on Delivery" },
    upi:      { bg: "#FFF8E1", color: "#B8860B", label: "📱 UPI — Awaiting Confirmation" },
  };
  const style = map[method] || map.cod;
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: "6px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13
    }}>{style.label}</span>
  );
}

export default function OrderSuccessScreen({ order, paymentMethod, onContinue }) {
  const [showTimeline, setShowTimeline] = useState(false);
  const currentStep = STATUS_STEPS.indexOf(order?.orderStatus || "placed");

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", paddingBottom: 40 }}>

      {/* Success animation */}
      <div style={{ background: "var(--gd)", padding: "48px 24px 32px", textAlign: "center" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.2)",
          margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 44, animation: "successPop .5s cubic-bezier(.34,1.56,.64,1)"
        }}>✅</div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: 26,
          fontWeight: 700, marginBottom: 8
        }}>Order Confirmed! 🎉</h1>

        {order?.orderNumber && (
          <div style={{ color: "var(--gold-l)", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            Order #{order.orderNumber}
          </div>
        )}

        <PaymentBadge method={paymentMethod || order?.paymentMethod} />
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* Order summary */}
        {order?.items?.length > 0 && (
          <div style={{ background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)", padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 12 }}>
              Order Summary
            </div>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: "var(--brown)" }}>
                  {item.emoji} {item.produceName} × {item.qty} {item.unit}
                </span>
                <span style={{ fontWeight: 600, color: "var(--terra)" }}>₹{item.subtotal}</span>
              </div>
            ))}
            <Divider style={{ margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16 }}>
              <span>Total</span>
              <span style={{ color: "var(--terra)" }}>₹{order.totalAmount}</span>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div style={{ background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)", padding: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 12 }}>
            What happens next?
          </div>
          {[
            { icon: "📞", text: "Farmer will call to confirm within 2 hours" },
            { icon: "🚚", text: "Delivery within 24-48 hours" },
            { icon: "💯", text: "100% of your payment reaches the farmer" },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</span>
              <span style={{ fontSize: 14, color: "var(--brown)", lineHeight: 1.5 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* 5serving Promise */}
        <AIPanel
          title="The 5serving Promise Fulfilled"
          body={
            <div>
              {[
                { icon: "🌾", label: "Farmer", desc: "Fair income, direct payment" },
                { icon: "🏠", label: "Family", desc: "Fresh produce at your door" },
                { icon: "🏘️", label: "Community", desc: "Local economy boosted" },
                { icon: "🌍", label: "Planet", desc: "Fewer food miles" },
                { icon: "💚", label: "Health", desc: "Seasonal, chemical-free" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 4 ? 8 : 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                  <span style={{ fontSize: 13, color: "var(--brown)" }}>
                    <strong>{p.label}:</strong> {p.desc}
                  </span>
                </div>
              ))}
            </div>
          }
        />

        {/* Track order toggle */}
        {showTimeline && (
          <div style={{ background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)", padding: 16, marginTop: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 16 }}>
              Order Timeline
            </div>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: i <= currentStep ? "var(--gd)" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 13, fontWeight: 700
                }}>
                  {i <= currentStep ? "✓" : i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: i <= currentStep ? "var(--gd)" : "var(--muted)", textTransform: "capitalize" }}>
                    {step}
                  </div>
                  {i === currentStep && (
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>Current status</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn block onClick={onContinue}>Continue Shopping</Btn>
          <Btn variant="outline" block onClick={() => setShowTimeline(v => !v)}>
            {showTimeline ? "Hide" : "Track"} My Order
          </Btn>
        </div>
      </div>

      <style>{`
        @keyframes successPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
