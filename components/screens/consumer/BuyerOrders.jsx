"use client";
import { useState, useEffect } from "react";
import { NavBar, Card, Badge, Btn, EmptyState, Spinner, Divider } from "@/components/ui";

const STATUS_STEPS    = ["placed", "confirmed", "dispatched", "delivered"];
const STATUS_COLOR    = { placed: "brown", confirmed: "gold", dispatched: "terra", delivered: "green", cancelled: "terra" };
const STATUS_ICON     = { placed: "📋", confirmed: "✅", dispatched: "🚚", delivered: "📦", cancelled: "✖" };
const PAY_COLOR       = { paid: "green", pending: "gold", failed: "terra", refunded: "brown" };
const CANCELLABLE     = new Set(["placed", "confirmed"]);

export default function BuyerOrders({ buyer, onBack, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const phone = buyer?.phone;

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetch(`/api/orders?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [phone]);

  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    setConfirmCancel(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o =>
        (o._id || o.id) === orderId ? { ...o, orderStatus: "cancelled" } : o
      ));
      showToast?.("Order cancelled");
    } catch {
      showToast?.("Could not cancel order. Please contact support.", "error");
    } finally {
      setCancelling(null);
    }
  };

  if (!phone) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        <NavBar title="My Orders" sub="Order history" onBack={onBack} />
        <EmptyState icon="📦" title="Not signed in" sub="Sign in as a buyer to see your orders." />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <NavBar title="My Orders" sub={`+91 ${phone}`} onBack={onBack} />

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><Spinner /></div>
      ) : orders.length === 0 ? (
        <div style={{ padding: 16 }}>
          <EmptyState icon="🛒" title="No orders yet" sub="Browse fresh produce from farmers and place your first order!" />
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, fontWeight: 600 }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} placed
          </div>

          {orders.map(order => {
            const orderId = order._id || order.id;
            const isExpanded = expanded === orderId;
            const stepIdx = STATUS_STEPS.indexOf(order.orderStatus);
            const isCancelled = order.orderStatus === "cancelled";
            const canCancel = CANCELLABLE.has(order.orderStatus);

            return (
              <Card key={orderId} style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>

                {/* Header */}
                <div onClick={() => setExpanded(isExpanded ? null : orderId)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>#{order.orderNumber}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--terra)", fontSize: 16 }}>₹{order.totalAmount}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                        <Badge variant={STATUS_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 10 }}>
                          {STATUS_ICON[order.orderStatus]} {order.orderStatus}
                        </Badge>
                        <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 10 }}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(order.items || []).map((item, i) => (
                      <span key={i} style={{ fontSize: 12, background: "var(--parch)", padding: "3px 8px", borderRadius: 10, color: "var(--brown)" }}>
                        {item.emoji} {item.produceName} × {item.qty} {item.unit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "var(--parch)" }}>

                    {/* Progress tracker */}
                    {!isCancelled && (
                      <div style={{ padding: "14px 16px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                          <div style={{ position: "absolute", top: 13, left: "12%", right: "12%", height: 2, background: "var(--border)", zIndex: 0 }} />
                          {STATUS_STEPS.map((step, i) => {
                            const done = i <= stepIdx;
                            return (
                              <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, flex: 1 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%",
                                  background: done ? "var(--gd)" : "#fff",
                                  border: `2px solid ${done ? "var(--gd)" : "var(--border)"}`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 13, color: done ? "#fff" : "var(--muted)", fontWeight: 700, marginBottom: 4
                                }}>
                                  {done ? "✓" : i + 1}
                                </div>
                                <div style={{ fontSize: 9, textTransform: "capitalize", fontWeight: 600, color: done ? "var(--gd)" : "var(--muted)", textAlign: "center" }}>
                                  {step}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isCancelled && (
                      <div style={{ padding: "12px 16px 0", color: "var(--terra)", fontSize: 13, fontWeight: 600 }}>
                        ✖ This order was cancelled
                      </div>
                    )}

                    <Divider style={{ margin: "12px 16px 0" }} />

                    {/* Items breakdown */}
                    <div style={{ padding: "10px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Items</div>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                          <span style={{ color: "var(--brown)" }}>
                            {item.emoji} {item.produceName} × {item.qty} {item.unit}
                            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>from {item.farmerName}</span>
                          </span>
                          <span style={{ fontWeight: 700, color: "var(--terra)" }}>₹{item.subtotal}</span>
                        </div>
                      ))}
                      <Divider style={{ margin: "8px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}>
                        <span>Total</span>
                        <span style={{ color: "var(--terra)" }}>₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery info */}
                    <div style={{ padding: "0 16px" }}>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
                        📍 {order.buyerAddress}
                        {order.community && <span> · 🏘️ {order.community}</span>}
                        <br />
                        💳 {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
                      </div>
                    </div>

                    {/* Cancel section */}
                    {canCancel && (
                      <div style={{ padding: "12px 16px 14px" }}>
                        {confirmCancel === orderId ? (
                          <div style={{
                            background: "#FFF3F3", border: "1.5px solid #FFCCCC",
                            borderRadius: "var(--r-sm)", padding: "12px 14px"
                          }}>
                            <div style={{ fontSize: 13, color: "var(--terra)", fontWeight: 600, marginBottom: 10 }}>
                              Cancel this order? The farmer will be notified and stock will be restored.
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Btn
                                variant="terra"
                                block
                                onClick={() => handleCancel(orderId)}
                                loading={cancelling === orderId}
                              >
                                Yes, cancel order
                              </Btn>
                              <Btn variant="outline" block onClick={() => setConfirmCancel(null)}>
                                Keep order
                              </Btn>
                            </div>
                          </div>
                        ) : (
                          <Btn
                            variant="outline"
                            block
                            onClick={() => setConfirmCancel(orderId)}
                            style={{ color: "var(--terra)", borderColor: "var(--terra)" }}
                          >
                            ✕ Cancel Order
                          </Btn>
                        )}
                      </div>
                    )}

                    {/* Dispatched — too late to cancel */}
                    {!canCancel && !isCancelled && (
                      <div style={{ padding: "10px 16px 14px", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                        Order is already {order.orderStatus} — contact support to cancel.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
