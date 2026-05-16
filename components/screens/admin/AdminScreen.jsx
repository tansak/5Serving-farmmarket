"use client";
import { useState, useEffect } from "react";
import { NavBar, Badge, Btn, Card, Spinner, Divider } from "@/components/ui";

const TABS = ["Overview", "Farmers", "Produce", "Orders", "Communities"];

const PAY_COLOR = { paid: "green", pending: "gold", failed: "terra", refunded: "brown" };
const ORDER_COLOR = { placed: "brown", confirmed: "gold", dispatched: "terra", delivered: "green", cancelled: "terra" };

export default function AdminScreen({ onNav, onAddFarmer }) {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState({ farmers: [], produce: [], orders: [], communities: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/farmers").then(r => r.json()).catch(() => []),
      fetch("/api/produce").then(r => r.json()).catch(() => []),
      fetch("/api/orders").then(r => r.json()).catch(() => []),
      fetch("/api/communities").then(r => r.json()).catch(() => []),
    ]).then(([farmers, produce, orders, communities]) => {
      setData({
        farmers: Array.isArray(farmers) ? farmers : [],
        produce: Array.isArray(produce) ? produce : [],
        orders: Array.isArray(orders) ? orders : [],
        communities: Array.isArray(communities) ? communities : [],
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleToggleProduce = async (item) => {
    const id = item._id || item.id;
    await fetch(`/api/produce/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available })
    });
    setData(d => ({
      ...d,
      produce: d.produce.map(p => (p._id || p.id) === id ? { ...p, available: !p.available } : p)
    }));
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <NavBar title="Admin Panel" sub="5serving FarmMarket" />

      {/* Tab nav */}
      <div style={{
        display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border)",
        background: "#fff", scrollbarWidth: "none"
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 16px", whiteSpace: "nowrap", fontWeight: 700, fontSize: 13,
            border: "none", borderBottom: tab === t ? "3px solid var(--gd)" : "3px solid transparent",
            background: "none", color: tab === t ? "var(--gd)" : "var(--muted)",
            cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "color .2s"
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><Spinner /></div>
      ) : (
        <div style={{ padding: 16 }}>

          {/* ── Overview ── */}
          {tab === "Overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Total Farmers",      val: data.farmers.length,     icon: "👨‍🌾", color: "var(--gd)" },
                  { label: "Total Produce",      val: data.produce.length,     icon: "🥦", color: "var(--gl)" },
                  { label: "Total Orders",       val: data.orders.length,      icon: "📦", color: "var(--terra)" },
                  { label: "Communities",        val: data.communities.length, icon: "🏘️", color: "var(--gold)" },
                ].map(stat => (
                  <Card key={stat.label} style={{ textAlign: "center", padding: 16 }}>
                    <div style={{ fontSize: 30, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: stat.color }}>
                      {stat.val}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{stat.label}</div>
                  </Card>
                ))}
              </div>

              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 12 }}>
                Recent Orders
              </h3>
              {data.orders.slice(0, 5).map(order => (
                <Card key={order._id} style={{ marginBottom: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>
                        #{order.orderNumber}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.buyerName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--terra)" }}>₹{order.totalAmount}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 9 }}>
                          {order.paymentStatus}
                        </Badge>
                        <Badge variant={ORDER_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 9 }}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ── Farmers ── */}
          {tab === "Farmers" && (
            <>
              <Btn block onClick={onAddFarmer} style={{ marginBottom: 16 }}>+ Register Farmer</Btn>
              {data.farmers.map(farmer => (
                <Card key={farmer._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", background: "var(--gs)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0
                    }}>👨‍🌾</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 15 }}>{farmer.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {farmer.village}, {farmer.district}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                        {farmer.crops?.map(c => <Badge key={c} variant="green" style={{ fontSize: 9 }}>{c}</Badge>)}
                        <Badge variant="brown" style={{ fontSize: 9 }}>
                          {data.produce.filter(p => p.farmerId === farmer._id).length} listings
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ── Produce ── */}
          {tab === "Produce" && (
            <>
              {data.produce.map(item => (
                <div key={item._id} style={{
                  background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
                  padding: "12px 14px", marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 12
                }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji || "🌱"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {item.farmerName} · {item.quantity} {item.unit} · ₹{item.price}/{item.unit}
                    </div>
                    {item.organic && <Badge variant="green" style={{ fontSize: 9, marginTop: 4 }}>Organic</Badge>}
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggleProduce(item)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: item.available ? "var(--gd)" : "var(--border)",
                      position: "relative", transition: "background .2s", flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", background: "#fff",
                      position: "absolute", top: 3, transition: "left .2s",
                      left: item.available ? 23 : 3
                    }} />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ── Orders ── */}
          {tab === "Orders" && (
            <>
              {data.orders.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>No orders yet</div>
              )}
              {data.orders.map(order => (
                <Card key={order._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>#{order.orderNumber}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          {order.buyerName} · {order.items?.length || 0} items
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "var(--terra)", marginBottom: 4 }}>₹{order.totalAmount}</div>
                        <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 9 }}>
                          {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
                        </Badge>
                        <br />
                        <Badge variant={ORDER_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 9, marginTop: 4 }}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                    </div>

                    {expanded === order._id && (
                      <div style={{ marginTop: 12 }}>
                        <Divider style={{ margin: "10px 0" }} />
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>📍 {order.buyerAddress}</div>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ fontSize: 13, color: "var(--brown)", marginBottom: 4 }}>
                            {item.emoji} {item.produceName} × {item.qty} {item.unit} — ₹{item.subtotal}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ── Communities ── */}
          {tab === "Communities" && (
            <>
              {data.communities.map(c => (
                <Card key={c._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {c.location}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <Badge variant="green">{c.members} members</Badge>
                        <Badge variant="brown">{c.type}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
