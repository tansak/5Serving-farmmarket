"use client";
import { useState, useEffect } from "react";
import { NavBar, Badge, Btn, Card, Spinner, Divider } from "@/components/ui";
import { authHeaders } from "@/lib/clientAuth";

const TABS = ["Overview", "Approvals", "Farmers", "Buyers", "Produce", "Orders", "Communities", "Reports", "Market Report"];
const PAY_COLOR   = { paid: "green", pending: "gold", failed: "terra", refunded: "brown" };
const ORDER_COLOR = { placed: "brown", confirmed: "gold", dispatched: "terra", delivered: "green", cancelled: "terra" };
const ORDER_NEXT  = { placed: "confirmed", confirmed: "dispatched", dispatched: "delivered" };

export default function AdminScreen({ onNav, onAddFarmer, showToast }) {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState({ farmers: [], pending: [], produce: [], orders: [], communities: [], buyers: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [approving, setApproving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, id, label }
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [marketReport, setMarketReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [communityForm, setCommunityForm] = useState({ name: "", location: "", type: "General", members: "" });
  const [savingCommunity, setSavingCommunity] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/farmers?status=approved").then(r => r.json()).catch(() => []),
      fetch("/api/farmers?status=pending").then(r => r.json()).catch(() => []),
      fetch("/api/produce").then(r => r.json()).catch(() => []),
      fetch("/api/orders").then(r => r.json()).catch(() => []),
      fetch("/api/communities").then(r => r.json()).catch(() => []),
      fetch("/api/buyers", { headers: authHeaders() }).then(r => r.json()).catch(() => []),
      fetch("/api/reports", { headers: authHeaders() }).then(r => r.json()).catch(() => []),
    ]).then(([farmers, pending, produce, orders, communities, buyers, reports]) => {
      setData({
        farmers:     Array.isArray(farmers)     ? farmers     : [],
        pending:     Array.isArray(pending)     ? pending     : [],
        produce:     Array.isArray(produce)     ? produce     : [],
        orders:      Array.isArray(orders)      ? orders      : [],
        communities: Array.isArray(communities) ? communities : [],
        buyers:      Array.isArray(buyers)      ? buyers      : [],
        reports:     Array.isArray(reports)     ? reports     : [],
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  /* ── Actions ── */

  const handleApprove = async (farmerId, status, reason = "") => {
    setApproving(farmerId);
    try {
      const res = await fetch(`/api/farmers/${farmerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error();
      showToast?.(status === "approved" ? "✓ Farmer approved!" : "Farmer rejected");
      loadData();
    } catch {
      showToast?.("Failed to update farmer status", "error");
    } finally {
      setApproving(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    const { type, id } = confirm;
    setDeleting(id);
    setConfirm(null);
    try {
      let url, method = "DELETE";
      if (type === "farmer")    url = `/api/farmers/${id}`;
      if (type === "buyer")     url = `/api/buyers/${id}`;
      if (type === "community") url = `/api/communities/${id}`;
      if (type === "produce")   url = `/api/produce/${id}`;
      if (type === "order")   { url = `/api/orders/${id}`; method = "PATCH"; }

      const body = type === "order"
        ? JSON.stringify({ orderStatus: "cancelled" })
        : undefined;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body,
      });
      if (!res.ok) throw new Error();

      const label = type === "order" ? "Order cancelled" : `${type[0].toUpperCase() + type.slice(1)} deleted`;
      showToast?.(`✓ ${label}`);
      loadData();
    } catch {
      showToast?.(`Failed to delete ${confirm?.type || "item"}`, "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleProduce = async (item) => {
    const id = item._id || item.id;
    await fetch(`/api/produce/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ available: !item.available }),
    });
    setData(d => ({
      ...d,
      produce: d.produce.map(p => (p._id || p.id) === id ? { ...p, available: !p.available } : p),
    }));
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (!res.ok) throw new Error();
      setData(d => ({ ...d, orders: d.orders.map(o => (o._id || o.id) === orderId ? { ...o, orderStatus: newStatus } : o) }));
      showToast?.(`Order marked as ${newStatus}`);
    } catch {
      showToast?.("Failed to update order", "error");
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleGenerateMarketReport = async () => {
    setReportLoading(true);
    setReportError("");
    try {
      const res = await fetch("/api/admin/market-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setMarketReport(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setData(d => ({ ...d, reports: d.reports.map(r => r._id === reportId ? { ...r, status } : r) }));
      showToast?.(`Report marked as ${status}`);
    } catch {
      showToast?.("Failed to update report", "error");
    }
  };

  const handleAddCommunity = async () => {
    if (!communityForm.name || !communityForm.location) {
      showToast?.("Name and location are required", "error"); return;
    }
    setSavingCommunity(true);
    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...communityForm, members: Number(communityForm.members) || 0 }),
      });
      if (!res.ok) throw new Error();
      showToast?.("Community added!");
      setCommunityForm({ name: "", location: "", type: "General", members: "" });
      setShowAddCommunity(false);
      loadData();
    } catch {
      showToast?.("Failed to add community", "error");
    } finally {
      setSavingCommunity(false);
    }
  };

  /* ── Shared delete confirm row ── */
  const DeleteConfirm = ({ type, id, label }) => {
    if (confirm?.id !== id) return null;
    return (
      <div style={{
        display: "flex", gap: 8, alignItems: "center", marginTop: 10,
        background: "#FFF3F3", borderRadius: "var(--r-sm)", padding: "10px 12px",
        border: "1.5px solid #FFCCCC"
      }}>
        <span style={{ flex: 1, fontSize: 12, color: "var(--terra)", fontWeight: 600 }}>
          {type === "order" ? "Cancel this order?" : `Delete ${label}?`} This cannot be undone.
        </span>
        <Btn size="sm" variant="terra" onClick={handleDelete} loading={deleting === id}>Yes</Btn>
        <Btn size="sm" variant="outline" onClick={() => setConfirm(null)}>No</Btn>
      </div>
    );
  };

  /* ── Tab bar ── */
  return (
    <div style={{ paddingBottom: 80 }}>
      <NavBar title="Admin Panel" sub="5serving FarmMarket" />

      <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border)", background: "#fff", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 14px", whiteSpace: "nowrap", fontWeight: 700, fontSize: 12,
            border: "none", borderBottom: tab === t ? "3px solid var(--gd)" : "3px solid transparent",
            background: "none", color: tab === t ? "var(--gd)" : "var(--muted)",
            cursor: "pointer", fontFamily: "'Nunito', sans-serif", transition: "color .2s", position: "relative"
          }}>
            {t}
            {t === "Approvals" && data.pending.length > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 4, background: "var(--terra)", color: "#fff",
                borderRadius: "50%", width: 16, height: 16, fontSize: 9,
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700
              }}>{data.pending.length}</span>
            )}
            {t === "Reports" && data.reports.filter(r => r.status === "open").length > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 4, background: "var(--terra)", color: "#fff",
                borderRadius: "50%", width: 16, height: 16, fontSize: 9,
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700
              }}>{data.reports.filter(r => r.status === "open").length}</span>
            )}
          </button>
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
                  { label: "Approved Farmers", val: data.farmers.length,     icon: "👨‍🌾", color: "var(--gd)" },
                  { label: "Pending Approval", val: data.pending.length,     icon: "⏳",   color: "var(--gold)" },
                  { label: "Total Produce",    val: data.produce.length,     icon: "🥦",  color: "var(--gl)" },
                  { label: "Total Orders",     val: data.orders.length,      icon: "📦",  color: "var(--terra)" },
                  { label: "Registered Buyers",val: data.buyers.length,      icon: "🛒",  color: "var(--brown)" },
                  { label: "Revenue",          val: `₹${data.orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString("en-IN")}`, icon: "💰", color: "var(--terra)" },
                ].map(stat => (
                  <Card key={stat.label} style={{ textAlign: "center", padding: 14 }}>
                    <div style={{ fontSize: 26, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.val}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{stat.label}</div>
                  </Card>
                ))}
              </div>

              {data.pending.length > 0 && (
                <div style={{
                  background: "var(--gold-s)", border: "1.5px solid var(--gold)",
                  borderRadius: "var(--r)", padding: "12px 16px", marginBottom: 16, cursor: "pointer"
                }} onClick={() => setTab("Approvals")}>
                  <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 14 }}>
                    ⏳ {data.pending.length} farmer{data.pending.length > 1 ? "s" : ""} awaiting approval
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Tap to review →</div>
                </div>
              )}

              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 12 }}>Recent Orders</h3>
              {data.orders.slice(0, 5).map(order => (
                <Card key={order._id} style={{ marginBottom: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>#{order.orderNumber}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.buyerName}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--terra)" }}>₹{order.totalAmount}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 9 }}>{order.paymentStatus}</Badge>
                        <Badge variant={ORDER_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 9 }}>{order.orderStatus}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* ── Approvals ── */}
          {tab === "Approvals" && (
            <>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--brown)", marginBottom: 16 }}>
                Pending Farmer Registrations
              </div>
              {data.pending.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontWeight: 600 }}>All registrations reviewed</div>
                </div>
              ) : (
                data.pending.map(farmer => (
                  <Card key={farmer._id} style={{ marginBottom: 14, padding: 16 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--gold-s)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>👨‍🌾</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 16 }}>{farmer.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {farmer.village}, {farmer.district}, {farmer.state}</div>
                        {farmer.phone && <div style={{ fontSize: 12, color: "var(--muted)" }}>📞 +91 {farmer.phone}</div>}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                          {farmer.crops?.map(c => <Badge key={c} variant="green" style={{ fontSize: 9 }}>{c}</Badge>)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                          Registered: {new Date(farmer.createdAt).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="primary" block onClick={() => handleApprove(farmer._id, "approved")} loading={approving === farmer._id}>✓ Approve</Btn>
                      <Btn variant="terra"   block onClick={() => handleApprove(farmer._id, "rejected", "Registration not approved")} loading={approving === farmer._id}>✕ Reject</Btn>
                    </div>
                  </Card>
                ))
              )}
            </>
          )}

          {/* ── Farmers ── */}
          {tab === "Farmers" && (
            <>
              <Btn block onClick={onAddFarmer} style={{ marginBottom: 16 }}>+ Register Farmer</Btn>
              {data.farmers.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>No approved farmers yet</div>
              )}
              {data.farmers.map(farmer => (
                <Card key={farmer._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--gs)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👨‍🌾</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 15 }}>{farmer.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{farmer.village}, {farmer.district}</div>
                      {farmer.phone && <div style={{ fontSize: 11, color: "var(--muted)" }}>📞 +91 {farmer.phone}</div>}
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                        {farmer.crops?.map(c => <Badge key={c} variant="green" style={{ fontSize: 9 }}>{c}</Badge>)}
                        <Badge variant="brown" style={{ fontSize: 9 }}>
                          {data.produce.filter(p => p.farmerId === farmer._id).length} listings
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirm({ type: "farmer", id: farmer._id, label: farmer.name })}
                      style={{ background: "none", border: "none", color: "var(--terra)", cursor: "pointer", fontSize: 18, padding: "4px 8px", alignSelf: "flex-start" }}
                      title="Remove farmer"
                    >🗑</button>
                  </div>
                  <DeleteConfirm type="farmer" id={farmer._id} label={farmer.name} />
                </Card>
              ))}
            </>
          )}

          {/* ── Buyers ── */}
          {tab === "Buyers" && (
            <>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, fontWeight: 600 }}>
                {data.buyers.length} registered buyer{data.buyers.length !== 1 ? "s" : ""}
              </div>
              {data.buyers.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                  <div style={{ fontWeight: 600 }}>No buyers yet</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Buyers appear here after placing their first order</div>
                </div>
              )}
              {data.buyers.map(buyer => (
                <Card key={buyer._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--parch)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🛒</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 15 }}>{buyer.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>📞 +91 {buyer.phone}</div>
                      {buyer.address && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>📍 {buyer.address}</div>}
                      {buyer.community && <div style={{ fontSize: 11, color: "var(--muted)" }}>🏘️ {buyer.community}</div>}
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Orders: {data.orders.filter(o => o.buyerPhone === buyer.phone).length}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirm({ type: "buyer", id: buyer._id, label: buyer.name || buyer.phone })}
                      style={{ background: "none", border: "none", color: "var(--terra)", cursor: "pointer", fontSize: 18, padding: "4px 8px", alignSelf: "flex-start" }}
                      title="Remove buyer"
                    >🗑</button>
                  </div>
                  <DeleteConfirm type="buyer" id={buyer._id} label={buyer.name || buyer.phone} />
                </Card>
              ))}
            </>
          )}

          {/* ── Produce ── */}
          {tab === "Produce" && (
            <>
              {data.produce.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>No produce listed yet</div>
              )}
              {data.produce.map(item => (
                <div key={item._id} style={{ background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)", padding: "12px 14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji || "🌱"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {item.farmerName} · {item.quantity} {item.unit} · ₹{item.price}/{item.unit}
                      </div>
                      {item.organic && <Badge variant="green" style={{ fontSize: 9, marginTop: 4 }}>Organic</Badge>}
                    </div>
                    {/* Toggle */}
                    <button onClick={() => handleToggleProduce(item)} style={{
                      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: item.available ? "var(--gd)" : "var(--border)",
                      position: "relative", transition: "background .2s", flexShrink: 0
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3, transition: "left .2s",
                        left: item.available ? 23 : 3
                      }} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => setConfirm({ type: "produce", id: item._id, label: item.name })}
                      style={{ background: "none", border: "none", color: "var(--terra)", cursor: "pointer", fontSize: 18, padding: "4px 6px", flexShrink: 0 }}
                      title="Remove produce"
                    >🗑</button>
                  </div>
                  <DeleteConfirm type="produce" id={item._id} label={item.name} />
                </div>
              ))}
            </>
          )}

          {/* ── Orders ── */}
          {tab === "Orders" && (
            <>
              <Btn variant="outline" block onClick={() => window.open("/api/orders/export", "_blank")} style={{ marginBottom: 14 }}>
                ⬇ Export All Orders (CSV)
              </Btn>
              {data.orders.length === 0 && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>No orders yet</div>
              )}
              {data.orders.map(order => {
                const orderId = order._id || order.id;
                const isExp = expanded === orderId;
                const nextStatus = ORDER_NEXT[order.orderStatus];
                return (
                  <Card key={orderId} style={{ marginBottom: 10, padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpanded(isExp ? null : orderId)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>#{order.orderNumber}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{order.buyerName} · {order.items?.length || 0} items</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(order.createdAt).toLocaleDateString("en-IN")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, color: "var(--terra)", marginBottom: 4 }}>₹{order.totalAmount}</div>
                          <Badge variant={PAY_COLOR[order.paymentStatus] || "brown"} style={{ fontSize: 9 }}>
                            {order.paymentMethod?.toUpperCase()} · {order.paymentStatus}
                          </Badge><br />
                          <Badge variant={ORDER_COLOR[order.orderStatus] || "brown"} style={{ fontSize: 9, marginTop: 4 }}>
                            {order.orderStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {isExp && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 14px", background: "var(--parch)" }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                          📞 {order.buyerPhone} · 📍 {order.buyerAddress}
                        </div>
                        {order.items?.map((item, i) => (
                          <div key={i} style={{ fontSize: 13, color: "var(--brown)", marginBottom: 4 }}>
                            {item.emoji} {item.produceName} × {item.qty} {item.unit} — ₹{item.subtotal}
                            {item.farmerName && <span style={{ color: "var(--muted)", fontSize: 11 }}> ({item.farmerName})</span>}
                          </div>
                        ))}
                        <Divider style={{ margin: "10px 0" }} />
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {nextStatus && order.orderStatus !== "cancelled" && (
                            <Btn
                              size="sm"
                              variant={nextStatus === "dispatched" ? "gold" : "primary"}
                              onClick={() => handleOrderStatus(orderId, nextStatus)}
                              loading={updatingOrder === orderId}
                            >
                              → {nextStatus}
                            </Btn>
                          )}
                          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
                            <Btn
                              size="sm"
                              variant="terra"
                              onClick={() => setConfirm({ type: "order", id: orderId, label: order.orderNumber })}
                            >
                              ✕ Cancel
                            </Btn>
                          )}
                        </div>
                        <DeleteConfirm type="order" id={orderId} label={`#${order.orderNumber}`} />
                      </div>
                    )}
                  </Card>
                );
              })}
            </>
          )}

          {/* ── Communities ── */}
          {tab === "Communities" && (
            <>
              <Btn block onClick={() => setShowAddCommunity(v => !v)} style={{ marginBottom: 14 }}>
                {showAddCommunity ? "✕ Cancel" : "+ Add Community"}
              </Btn>

              {showAddCommunity && (
                <Card style={{ marginBottom: 16, padding: 16 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "var(--brown)", marginBottom: 14 }}>New Community</div>
                  {[
                    { label: "Community Name *", key: "name",     placeholder: "e.g. Bengaluru Organic Buyers" },
                    { label: "Location *",        key: "location", placeholder: "e.g. Bengaluru, Karnataka" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>{label}</div>
                      <input
                        value={communityForm[key]}
                        onChange={e => setCommunityForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 12px", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", color: "var(--ink)", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Type</div>
                    <select
                      value={communityForm.type}
                      onChange={e => setCommunityForm(f => ({ ...f, type: e.target.value }))}
                      style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 12px", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", color: "var(--ink)", background: "#fff", boxSizing: "border-box" }}
                    >
                      {["General", "Urban Community", "Organic Buyers", "Home Cooks", "Apartment Complex", "Office Colony", "Housing Society"].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>Estimated Members</div>
                    <input
                      type="number"
                      value={communityForm.members}
                      onChange={e => setCommunityForm(f => ({ ...f, members: e.target.value }))}
                      placeholder="e.g. 150"
                      style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 12px", fontSize: 14, fontFamily: "'Nunito', sans-serif", outline: "none", color: "var(--ink)", boxSizing: "border-box" }}
                    />
                  </div>
                  <Btn block onClick={handleAddCommunity} loading={savingCommunity}>Save Community</Btn>
                </Card>
              )}

              {data.communities.length === 0 && !showAddCommunity && (
                <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏘️</div>
                  <div style={{ fontWeight: 600 }}>No communities yet</div>
                </div>
              )}

              {data.communities.map(c => (
                <Card key={c._id} style={{ marginBottom: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "var(--brown)", fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>📍 {c.location}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <Badge variant="green">{c.members} members</Badge>
                        <Badge variant="brown">{c.type}</Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirm({ type: "community", id: c._id, label: c.name })}
                      style={{ background: "none", border: "none", color: "var(--terra)", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}
                      title="Remove community"
                    >🗑</button>
                  </div>
                  <DeleteConfirm type="community" id={c._id} label={c.name} />
                </Card>
              ))}
            </>
          )}

          {/* ── Market Report ── */}
          {tab === "Market Report" && (() => {
            const STATUS_META = {
              "great-deal":   { color: "var(--gd)",    bg: "var(--gs)",    label: "Great Deal", icon: "🟢" },
              "competitive":  { color: "#7A5A00",      bg: "#FFF8E1",      label: "Competitive", icon: "🟡" },
              "fair":         { color: "var(--brown)",  bg: "var(--parch)", label: "Fair Price",  icon: "⚪" },
              "above-market": { color: "var(--terra)",  bg: "#FFF3F3",      label: "Above Market", icon: "🔴" },
            };

            return (
              <>
                {/* Header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "var(--brown)", marginBottom: 6 }}>
                    AI Market Price Analysis
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
                    Compares farmer listing prices with current Indian retail and wholesale market prices.
                    Powered by Claude AI — updated on demand.
                  </div>
                  <Btn
                    block
                    onClick={handleGenerateMarketReport}
                    loading={reportLoading}
                    variant="primary"
                  >
                    {reportLoading ? "Analysing prices…" : marketReport ? "🔄 Refresh Report" : "✨ Generate Market Report"}
                  </Btn>
                  {reportLoading && (
                    <div style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
                      Claude is comparing {data.produce.length} produce items with market prices…
                    </div>
                  )}
                  {reportError && (
                    <div style={{ color: "var(--terra)", fontSize: 13, marginTop: 10, fontWeight: 600 }}>
                      ⚠ {reportError}
                    </div>
                  )}
                </div>

                {marketReport && (
                  <>
                    {/* Report header */}
                    <div style={{
                      background: "linear-gradient(135deg, var(--gd), var(--gm))",
                      borderRadius: "var(--r)", padding: "16px 18px", marginBottom: 14, color: "#fff"
                    }}>
                      <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>
                        Report generated · {marketReport.report_date}
                      </div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                        Market Analysis Summary
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.92 }}>
                        {marketReport.executive_summary}
                      </div>
                    </div>

                    {/* Market context */}
                    <div style={{
                      background: "#FFF8E1", border: "1.5px solid var(--gold)",
                      borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: 14,
                      fontSize: 12, color: "var(--brown)", lineHeight: 1.6
                    }}>
                      📊 <strong>Market Context:</strong> {marketReport.market_context}
                    </div>

                    {/* Summary KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {[
                        {
                          icon: "🛒",
                          label: "Avg Buyer Saving",
                          val: `${marketReport.avg_buyer_savings_percent?.toFixed(0)}%`,
                          sub: "vs retail price",
                          color: "var(--gd)"
                        },
                        {
                          icon: "👨‍🌾",
                          label: "Farmer Premium",
                          val: `${marketReport.avg_farmer_premium_percent?.toFixed(0)}%`,
                          sub: "vs mandi price",
                          color: "var(--gold)"
                        },
                        {
                          icon: "💰",
                          label: "Est. Monthly Saving",
                          val: `₹${(marketReport.est_monthly_buyer_savings_inr || 0).toLocaleString("en-IN")}`,
                          sub: "across all buyers",
                          color: "var(--terra)"
                        },
                      ].map(k => (
                        <Card key={k.label} style={{ textAlign: "center", padding: "12px 6px" }}>
                          <div style={{ fontSize: 20, marginBottom: 2 }}>{k.icon}</div>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: k.color }}>
                            {k.val}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{k.label}<br />{k.sub}</div>
                        </Card>
                      ))}
                    </div>

                    {/* Per-produce comparison */}
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "var(--brown)", marginBottom: 10 }}>
                      Produce Price Comparison
                    </div>

                    {(marketReport.items || []).map((item, i) => {
                      const meta = STATUS_META[item.status] || STATUS_META["fair"];
                      return (
                        <div key={i} style={{
                          background: "#fff", borderRadius: "var(--r)", marginBottom: 10,
                          border: `2px solid ${meta.color}22`,
                          boxShadow: "var(--shadow)", overflow: "hidden"
                        }}>
                          {/* Item header */}
                          <div style={{
                            background: meta.bg, padding: "10px 14px",
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                          }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brown)" }}>
                                {item.produce_name}
                                {item.organic && <span style={{ fontSize: 10, color: "var(--gd)", marginLeft: 6, fontWeight: 700 }}>🌿 Organic</span>}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.category}</div>
                            </div>
                            <div style={{
                              background: meta.color, color: "#fff",
                              borderRadius: 20, padding: "4px 10px",
                              fontSize: 10, fontWeight: 700
                            }}>
                              {meta.icon} {meta.label}
                            </div>
                          </div>

                          {/* Price comparison */}
                          <div style={{ padding: "12px 14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>FARMER PRICE</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--gd)" }}>
                                  ₹{item.farmer_price}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--muted)" }}>per {item.unit}</div>
                              </div>
                              <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>MANDI PRICE</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--gold)" }}>
                                  ₹{item.wholesale_mandi_price}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--muted)" }}>per {item.unit}</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>RETAIL PRICE</div>
                                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "var(--terra)" }}>
                                  ₹{item.retail_market_price}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--muted)" }}>per {item.unit}</div>
                              </div>
                            </div>

                            {/* Savings pills */}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              {item.buyer_savings_per_unit > 0 && (
                                <div style={{
                                  background: "var(--gs)", color: "var(--gd)", borderRadius: 20,
                                  padding: "4px 10px", fontSize: 11, fontWeight: 700
                                }}>
                                  🛒 Buyer saves ₹{item.buyer_savings_per_unit}/{item.unit} ({item.buyer_savings_percent?.toFixed(0)}% off retail)
                                </div>
                              )}
                              {item.farmer_premium_over_mandi > 0 && (
                                <div style={{
                                  background: "#FFF8E1", color: "#7A5A00", borderRadius: 20,
                                  padding: "4px 10px", fontSize: 11, fontWeight: 700
                                }}>
                                  👨‍🌾 Farmer earns ₹{item.farmer_premium_over_mandi}/{item.unit} more than mandi ({item.farmer_premium_percent?.toFixed(0)}% premium)
                                </div>
                              )}
                              {item.sold_last_30d > 0 && (
                                <div style={{
                                  background: "var(--parch)", color: "var(--brown)", borderRadius: 20,
                                  padding: "4px 10px", fontSize: 11, fontWeight: 600
                                }}>
                                  📦 {item.sold_last_30d} {item.unit} sold last 30 days
                                </div>
                              )}
                            </div>

                            {/* AI insight */}
                            <div style={{
                              fontSize: 12, color: "var(--muted)", fontStyle: "italic",
                              borderTop: "1px solid var(--border)", paddingTop: 8, lineHeight: 1.5
                            }}>
                              💡 {item.insight}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Platform highlights */}
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "var(--brown)", marginBottom: 10, marginTop: 6 }}>
                      Platform Value Highlights
                    </div>
                    <Card style={{ padding: 16, marginBottom: 14 }}>
                      {(marketReport.platform_highlights || []).map((h, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 10, marginBottom: i < marketReport.platform_highlights.length - 1 ? 10 : 0,
                          fontSize: 13, color: "var(--brown)", lineHeight: 1.5
                        }}>
                          <span style={{ color: "var(--gd)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </Card>

                    {/* Admin recommendation */}
                    <div style={{
                      background: "linear-gradient(135deg, var(--gs), #E8F5E9)",
                      border: "1.5px solid var(--gl)", borderRadius: "var(--r)",
                      padding: "14px 16px"
                    }}>
                      <div style={{ fontWeight: 700, color: "var(--gd)", fontSize: 13, marginBottom: 6 }}>
                        🎯 Admin Recommendation
                      </div>
                      <div style={{ fontSize: 13, color: "var(--brown)", lineHeight: 1.6 }}>
                        {marketReport.recommendation}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}

          {/* ── Reports ── */}
          {tab === "Reports" && (() => {
            const STATUS_COLOR = { open: "terra", resolved: "green", dismissed: "brown" };
            const CATEGORY_ICON = { Bug: "🐛", "Wrong Info": "⚠️", Suggestion: "💡", Other: "📝" };
            const openReports = data.reports.filter(r => r.status === "open");
            const doneReports = data.reports.filter(r => r.status !== "open");
            return (
              <>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Open",     val: openReports.length,  color: "var(--terra)" },
                    { label: "Resolved", val: doneReports.filter(r => r.status === "resolved").length, color: "var(--gd)" },
                    { label: "Total",    val: data.reports.length,  color: "var(--brown)" },
                  ].map(s => (
                    <Card key={s.label} style={{ flex: 1, textAlign: "center", padding: "10px 6px" }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.label}</div>
                    </Card>
                  ))}
                </div>

                {data.reports.length === 0 && (
                  <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 600 }}>No reports yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>User-submitted reports will appear here</div>
                  </div>
                )}

                {[...openReports, ...doneReports].map(report => (
                  <Card key={report._id} style={{ marginBottom: 10, padding: 14, opacity: report.status !== "open" ? 0.7 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{CATEGORY_ICON[report.category] || "📝"}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brown)" }}>{report.category}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {report.role && <>{report.role}</>}
                            {report.phone && <> · +91 {report.phone}</>}
                            {" · "}{new Date(report.createdAt).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      </div>
                      <Badge variant={STATUS_COLOR[report.status] || "brown"} style={{ fontSize: 9, flexShrink: 0 }}>
                        {report.status}
                      </Badge>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--brown)", lineHeight: 1.6, marginBottom: 10, margin: "0 0 10px" }}>
                      {report.description}
                    </p>

                    {report.status === "open" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn size="sm" variant="primary" block onClick={() => handleReportStatus(report._id, "resolved")}>
                          ✓ Mark Resolved
                        </Btn>
                        <Btn size="sm" variant="outline" block onClick={() => handleReportStatus(report._id, "dismissed")}>
                          Dismiss
                        </Btn>
                      </div>
                    )}
                  </Card>
                ))}
              </>
            );
          })()}

        </div>
      )}
    </div>
  );
}
