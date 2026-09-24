"use client";
import { useState, useEffect } from "react";
import { NavBar, Card, Badge, Btn, EmptyState, Spinner, Divider } from "@/components/ui";

const STATUS_COLOR = {
  placed: "brown", confirmed: "gold", dispatched: "terra", delivered: "green", cancelled: "terra"
};
const PAY_COLOR = { paid: "green", pending: "gold", failed: "terra", refunded: "brown" };

const NEXT_STATUS = {
  placed:     "confirmed",
  confirmed:  "dispatched",
  dispatched: "delivered",
};

const STATUS_LABEL = {
  confirmed:  "✅ Confirm Order",
  dispatched: "🚚 Mark as Dispatched",
  delivered:  "📦 Mark as Delivered",
};

export default function FarmerOrders({ farmer, onBack, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const farmerId = farmer?._id || farmer?.id;
  const farmerName = farmer?.name;

  useEffect(() => {
    if (!farmerId && !farmerName) { setLoading(false); return; }
    const params = farmerId ? `farmerId=${farmerId}` : `farmerName=${encodeURIComponent(farmerName)}`;
    fetch(`/api/orders?${params}`)
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [farmerId, farmerName]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => (o._id || o.id) === orderId ? { ...o, orderStatus: newStatus } : o));
      showToast?.(`Order marked as ${newStatus}`);
    } catch {
      showToast?.("Failed to update order status", "error");
    } finally {
      setUpdating(null);
    }
  };

  const handleDownload = () => {
    const params = farmerId
      ? `farmerId=${farmerId}`
      : `farmerName=${encodeURIComponent(farmerName)}`;
    window.open(`/api/orders/export?${params}`, "_blank");
  };

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => {
    const myItems = o.items?.filter(i =>
      (farmerId && i.farmerId === farmerId) || (farmerName && i.farmerName === farmerName)
    ) || [];
    return sum + myItems.reduce((s, i) => s + (i.subtotal || 0), 0);
  }, 0);
  const pending = orders.filter(o => ["placed", "confirmed"].includes(o.orderStatus)).length;
  const delivered = orders.filter(o => o.orderStatus === "delivered").length;

  return (
    <div style={{ paddingBottom: 90 }}>
      <NavBar
        title="My Orders"
        sub={farmer?.name}
        onBack={onBack}
        right={
          <button onClick={handleDownload} style={{
            background: "rgba(255,255,255,.2)", border: "none", color: "#fff",
            borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontWeight: 700
          }}>⬇ CSV</button>
        }
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><Spinner /></div>
      ) : (
        <div style={{ padding: 16 }}>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total Orders", val: orders.length, icon: "📦", color: "var(--gd)" },
              { label: "Pending",      val: pending,        icon: "⏳", color: "var(--gold)" },
              { label: "Delivered",    val: delivered,      icon: "✅", color: "var(--gl)" },
            ].map(s => (
              <Card key={s.label} style={{ textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.label}</div>
              </Card>
            ))}
          </div>

          <div style={{
            background: "var(--gs)", borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>Total Revenue (your items)</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--gd)" }}>
              ₹{totalRevenue.toFixed(0)}
            </span>
          </div>

          {orders.length === 0 ? (
            <EmptyState icon="📦" title="No orders yet" sub="Orders for your produce will appear here." />
          ) : (
            orders.map(order => {
              const myItems = (order.items || []).filter(i =>
                (farmerId && i.farmerId === farmerId) || (farmerName && i.farmerName === farmerName)
              );
              const myTotal = myItems.reduce((s, i) => s + (i.subtotal || 0), 0);
              const isExpanded = expanded === (order._id || order.id);
              const nextStatus = NEXT_STATUS[order.orderStatus];
              const orderId = order._id || order.id;

              return (
                <Card key={orderId} style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
                  {/* Order header */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : orderId)}
                    style={{ padding: "12px 14px", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>
                          #{order.orderNumber}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          👤 {order.buyerName} · {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--terra)" }}>₹{myTotal}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                          <Badge variant={STATUS_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 9 }}>
                            {order.orderStatus}
                          </Badge>
                          <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 9 }}>
                            {order.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* My items preview */}
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {myItems.map((item, i) => (
                        <span key={i} style={{
                          fontSize: 12, background: "var(--parch)", padding: "3px 8px",
                          borderRadius: 10, color: "var(--brown)"
                        }}>
                          {item.emoji} {item.produceName} × {item.qty} {item.unit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", background: "var(--parch)" }}>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                        📞 {order.buyerPhone} · 📍 {order.buyerAddress}
                      </div>
                      {order.community && (
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                          🏘️ Community: {order.community}
                        </div>
                      )}
                      {order.notes && (
                        <div style={{ fontSize: 12, color: "var(--brown)", marginBottom: 8, fontStyle: "italic" }}>
                          📝 {order.notes}
                        </div>
                      )}
                      <Divider style={{ margin: "8px 0" }} />
                      <div style={{ fontWeight: 700, fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>ORDER ITEMS</div>
                      {myItems.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span>{item.emoji} {item.produceName} × {item.qty} {item.unit}</span>
                          <span style={{ fontWeight: 700, color: "var(--terra)" }}>₹{item.subtotal}</span>
                        </div>
                      ))}

                      {/* Status update button */}
                      {nextStatus && order.orderStatus !== "cancelled" && (
                        <div style={{ marginTop: 12 }}>
                          <Btn
                            variant={nextStatus === "dispatched" ? "gold" : "primary"}
                            block
                            onClick={() => handleUpdateStatus(orderId, nextStatus)}
                            loading={updating === orderId}
                          >
                            {STATUS_LABEL[nextStatus] || `Mark as ${nextStatus}`}
                          </Btn>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}

          {orders.length > 0 && (
            <Btn variant="outline" block onClick={handleDownload} style={{ marginTop: 8 }}>
              ⬇ Download Full Report (CSV)
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}
