"use client";
import { useState, useEffect } from "react";

import LandingScreen from "@/components/screens/LandingScreen";
import OTPAuthScreen from "@/components/screens/auth/OTPAuthScreen";
import FarmerHome from "@/components/screens/farmer/FarmerHome";
import AddProduceScreen from "@/components/screens/farmer/AddProduceScreen";
import AddFarmerScreen from "@/components/screens/farmer/AddFarmerScreen";
import FarmerProduceDetail from "@/components/screens/farmer/FarmerProduceDetail";
import FarmerOrders from "@/components/screens/farmer/FarmerOrders";
import ConsumerHome from "@/components/screens/consumer/ConsumerHome";
import ProductDetail from "@/components/screens/consumer/ProductDetail";
import CartScreen from "@/components/screens/consumer/CartScreen";
import CheckoutScreen from "@/components/screens/consumer/CheckoutScreen";
import BuyerOrders from "@/components/screens/consumer/BuyerOrders";
import OrderSuccessScreen from "@/components/screens/OrderSuccessScreen";
import AdminScreen from "@/components/screens/admin/AdminScreen";
import { BottomTabBar, Toast } from "@/components/ui";
import ReportIssueScreen from "@/components/screens/ReportIssueScreen";
import { decodeSessionToken, clearSessionToken } from "@/lib/clientAuth";

/* ─── Seed data (fallback when MongoDB is unavailable) ─── */
const SEED_FARMERS = [
  { _id: "f1", id: "f1", name: "Ramu Gowda",      village: "Channarayapatna", district: "Hassan",     state: "Karnataka",   crops: ["Vegetables","Grains"] },
  { _id: "f2", id: "f2", name: "Savita Devi",      village: "Wai",             district: "Satara",     state: "Maharashtra", crops: ["Fruits","Pulses"] },
  { _id: "f3", id: "f3", name: "Krishnamurthy R",  village: "Ponneri",         district: "Tiruvallur", state: "Tamil Nadu",  crops: ["Herbs","Spices"] },
];
const SEED_PRODUCE = [
  { _id: "p1", id: "p1", farmerId: "f1", farmerName: "Ramu Gowda",     village: "Hassan, Karnataka",      name: "Country Tomatoes",  category: "Vegetables", quantity: 50,  unit: "kg",    price: 28,  organic: true,  emoji: "🍅", available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Fresh country tomatoes from Hassan." },
  { _id: "p2", id: "p2", farmerId: "f2", farmerName: "Savita Devi",    village: "Satara, Maharashtra",    name: "Alphonso Mangoes",  category: "Fruits",     quantity: 100, unit: "kg",    price: 180, organic: true,  emoji: "🥭", available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Sweet Alphonso mangoes from Satara." },
  { _id: "p3", id: "p3", farmerId: "f1", farmerName: "Ramu Gowda",     village: "Hassan, Karnataka",      name: "Red Rice",          category: "Grains",     quantity: 200, unit: "kg",    price: 65,  organic: false, emoji: "🌾", available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Traditional red rice from Karnataka." },
  { _id: "p4", id: "p4", farmerId: "f3", farmerName: "Krishnamurthy R",village: "Tiruvallur, Tamil Nadu", name: "Fresh Curry Leaves",category: "Herbs",      quantity: 20,  unit: "kg",    price: 40,  organic: true,  emoji: "🌿", available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Organic curry leaves from Tamil Nadu." },
  { _id: "p5", id: "p5", farmerId: "f2", farmerName: "Savita Devi",    village: "Satara, Maharashtra",    name: "Chana Dal",         category: "Pulses",     quantity: 80,  unit: "kg",    price: 90,  organic: false, emoji: "🫘", available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Quality chana dal from Maharashtra." },
  { _id: "p6", id: "p6", farmerId: "f3", farmerName: "Krishnamurthy R",village: "Tiruvallur, Tamil Nadu", name: "Red Chilli Powder", category: "Spices",     quantity: 30,  unit: "kg",    price: 160, organic: true,  emoji: "🌶️",available: true, harvestDate: new Date().toISOString().slice(0,10), description: "Fiery red chilli powder, naturally dried." },
];

export default function FarmMarket({ initialRole } = {}) {
  const [screen, setScreen] = useState(() => initialRole ? "otp-auth" : "landing");
  const [params, setParams] = useState(() => initialRole ? { role: initialRole } : {});
  const [role, setRole] = useState(initialRole || "");
  const [farmer, setFarmer] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [farmers, setFarmers] = useState(SEED_FARMERS);
  const [produce, setProduce] = useState(SEED_PRODUCE);
  const [communities, setCommunities] = useState([]);

  /* ─── Data loading ─── */
  useEffect(() => {
    fetch("/api/farmers").then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) setFarmers(d); }).catch(() => {});
    fetch("/api/produce").then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) setProduce(d); }).catch(() => {});
    fetch("/api/communities").then(r => r.json()).then(d => { if (Array.isArray(d)) setCommunities(d); }).catch(() => {});
  }, []);

  /* ─── Session restore on page refresh ─── */
  useEffect(() => {
    const payload = decodeSessionToken();
    if (!payload) return;
    setRole(payload.role);
    if (payload.role === "admin") {
      nav("admin");
    } else if (payload.role === "farmer" && payload.farmerId) {
      fetch(`/api/farmers/${payload.farmerId}`)
        .then(r => r.json())
        .then(f => {
          if (f && !f.error) { setFarmer(f); refreshFarmers(); nav("farmer-home"); }
          else clearSessionToken();
        })
        .catch(() => clearSessionToken());
    } else if (payload.phone) {
      setBuyer({ phone: payload.phone });
      nav("consumer-home");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Cart persistence across refreshes ─── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("5sf_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("5sf_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);

  /* ─── Navigation ─── */
  const nav = (screenKey, paramsObj = {}) => {
    setScreen(screenKey);
    setParams(paramsObj);
  };

  /* ─── Toast ─── */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 2500);
  };

  /* ─── Role handler ─── */
  const handleRole = (r) => {
    setRole(r);
    nav("otp-auth", { role: r });
  };

  /* ─── Cart operations ─── */
  const addToCart = (item) => {
    const id = item._id || item.id;
    setCart(c => {
      const existing = c.find(ci => (ci._id || ci.id) === id);
      if (existing) return c.map(ci => (ci._id || ci.id) === id ? { ...ci, qty: (ci.qty || 1) + (item.qty || 1) } : ci);
      return [...c, { ...item, qty: item.qty || 1 }];
    });
  };
  const removeFromCart = (produceId) => setCart(c => c.filter(ci => (ci._id || ci.id) !== produceId));
  const updateCartQty = (produceId, qty) => {
    if (qty <= 0) removeFromCart(produceId);
    else setCart(c => c.map(ci => (ci._id || ci.id) === produceId ? { ...ci, qty } : ci));
  };
  const clearCart = () => setCart([]);
  const cartCount = cart.length;
  const cartTotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  /* ─── Data refresh helpers ─── */
  const refreshProduce = () => {
    fetch("/api/produce").then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) setProduce(d); }).catch(() => {});
  };
  const refreshFarmers = () => {
    fetch("/api/farmers").then(r => r.json()).then(d => { if (Array.isArray(d) && d.length) setFarmers(d); }).catch(() => {});
  };

  /* ─── Tab bars ─── */
  const farmerTabs = [
    { id: "farmer-home",   icon: "🌾", label: "My Farm" },
    { id: "add-produce",   icon: "➕", label: "Add Produce" },
    { id: "farmer-orders", icon: "📦", label: "Orders" },
    { id: "landing",       icon: "🔄", label: "Switch" },
  ];
  const consumerTabs = [
    { id: "consumer-home", icon: "🏪", label: "Market" },
    { id: "cart",          icon: "🛒", label: "Cart", badge: cartCount },
    { id: "buyer-orders",  icon: "📦", label: "My Orders" },
    { id: "landing",       icon: "🔄", label: "Switch" },
  ];
  const adminTabs = [
    { id: "admin",   icon: "⚙️", label: "Admin" },
    { id: "landing", icon: "🔄", label: "Switch" },
  ];

  const tabs = role === "farmer" ? farmerTabs : role === "admin" ? adminTabs : consumerTabs;

  const handleTabSwitch = (tabId) => {
    if (tabId === "landing") { setRole(""); setFarmer(null); setBuyer(null); clearSessionToken(); nav("landing"); }
    else if (tabId === "add-produce") nav(tabId, { farmerId: farmer?._id || farmer?.id || farmers[0]?._id });
    else nav(tabId);
  };

  /* ─── Screen renderer ─── */
  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return <LandingScreen onRole={handleRole} />;

      case "otp-auth":
        return (
          <OTPAuthScreen
            role={params.role}
            onVerified={({ phone, farmer: f, isNewUser }) => {
              if (params.role === "admin") {
                setRole("admin");
                nav("admin");
              } else if (params.role === "farmer") {
                if (isNewUser) {
                  nav("add-farmer", { prefillPhone: phone, backTo: "landing" });
                } else if (f?.status === "pending") {
                  nav("farmer-pending", { farmer: f });
                } else {
                  setFarmer(f);
                  refreshFarmers();
                  nav("farmer-home");
                }
              } else {
                setBuyer({ phone });
                nav("consumer-home");
              }
            }}
            onBack={() => nav("landing")}
          />
        );

      case "farmer-home":
        return (
          <FarmerHome
            farmers={farmers}
            produce={produce}
            currentFarmer={farmer}
            onNav={(s, p) => { if (s === "add-farmer") nav("add-farmer", p); else nav(s, p); }}
          />
        );

      case "farmer-pending":
        return (
          <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--brown)", fontSize: 24, marginBottom: 12 }}>
              Approval Pending
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>
              Welcome back, {params.farmer?.name}! Your account is still under review. Our admin team will approve it within 24 hours.
            </p>
            <div style={{ background: "var(--gs)", borderRadius: "var(--r)", padding: "14px 20px", marginBottom: 24, width: "100%" }}>
              <div style={{ fontWeight: 700, color: "var(--gd)", marginBottom: 4 }}>What happens next?</div>
              <div style={{ fontSize: 13, color: "var(--brown)", lineHeight: 1.7 }}>
                📞 Admin will verify your details<br />
                ✅ Account approved within 24 hours<br />
                🌾 Start listing your produce
              </div>
            </div>
            <button
              onClick={() => { setRole(""); nav("landing"); }}
              style={{ background: "var(--gd)", color: "#fff", border: "none", borderRadius: 30, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif", width: "100%" }}
            >Back to Home</button>
          </div>
        );

      case "add-produce":
        return (
          <AddProduceScreen
            farmers={farmers}
            initialFarmerId={params.farmerId || farmer?._id || farmer?.id}
            currentFarmer={role === "admin" ? null : farmer}
            onSave={() => { refreshProduce(); nav(role === "admin" ? "admin" : "farmer-home"); }}
            onBack={() => nav(role === "admin" ? "admin" : "farmer-home")}
            showToast={showToast}
          />
        );

      case "add-farmer":
        return (
          <AddFarmerScreen
            onSave={() => { refreshFarmers(); nav("farmer-home"); }}
            onBack={() => nav(params.backTo || "farmer-home")}
            showToast={showToast}
            prefillPhone={params.prefillPhone}
          />
        );

      case "farmer-produce-detail":
        return (
          <FarmerProduceDetail
            produce={params.produce}
            onBack={() => nav("farmer-home")}
            onUpdate={(updated) => setProduce(ps => ps.map(p => (p._id || p.id) === (updated._id || updated.id) ? updated : p))}
            showToast={showToast}
          />
        );

      case "farmer-orders":
        return (
          <FarmerOrders
            farmer={farmer}
            onBack={() => nav("farmer-home")}
            showToast={showToast}
          />
        );

      case "consumer-home":
        return (
          <ConsumerHome
            produce={produce}
            cart={cart}
            onSelectProduce={(item) => nav("product-detail", { product: item })}
          />
        );

      case "product-detail":
        return (
          <ProductDetail
            product={params.product}
            cart={cart}
            onBack={() => nav("consumer-home")}
            onAddToCart={addToCart}
            showToast={showToast}
          />
        );

      case "cart":
        return (
          <CartScreen
            cart={cart}
            onBack={() => nav("consumer-home")}
            onRemoveItem={removeFromCart}
            onUpdateQty={updateCartQty}
            onCheckout={() => nav("checkout")}
          />
        );

      case "checkout":
        return (
          <CheckoutScreen
            cart={cart}
            onBack={() => nav("cart")}
            onOrderPlaced={(order) => { clearCart(); nav("order-success", { order, paymentMethod: order.paymentMethod }); }}
            showToast={showToast}
            buyerPhone={buyer?.phone}
          />
        );

      case "buyer-orders":
        return (
          <BuyerOrders
            buyer={buyer}
            onBack={() => nav("consumer-home")}
            showToast={showToast}
          />
        );

      case "order-success":
        return (
          <OrderSuccessScreen
            order={params.order}
            paymentMethod={params.paymentMethod}
            onContinue={() => nav("consumer-home")}
          />
        );

      case "admin":
        return (
          <AdminScreen
            onNav={nav}
            onAddFarmer={() => nav("add-farmer", {})}
            showToast={showToast}
          />
        );

      case "report-issue":
        return (
          <ReportIssueScreen
            role={role}
            phone={farmer?.phone || buyer?.phone || ""}
            onBack={() => nav(params.backTo || "landing")}
            showToast={showToast}
          />
        );

      default:
        return <LandingScreen onRole={handleRole} />;
    }
  };

  const showBottomBar = role && !["landing", "otp-auth", "farmer-pending", "order-success", "checkout"].includes(screen);
  const showReportBtn = role && !["landing", "otp-auth", "report-issue", "order-success", "checkout"].includes(screen);

  return (
    <div className="app-shell" style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: "var(--cream)", position: "relative"
    }}>
      {renderScreen()}
      {showBottomBar && (
        <BottomTabBar tabs={tabs} activeTab={screen} onTab={handleTabSwitch} />
      )}
      {showReportBtn && (
        <button
          onClick={() => nav("report-issue", { backTo: screen })}
          title="Report an issue"
          style={{
            position: "fixed",
            bottom: showBottomBar ? 76 : 20,
            right: 16,
            background: "var(--gd)",
            color: "#fff",
            border: "none",
            borderRadius: 30,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(27,67,50,.35)",
            display: "flex",
            alignItems: "center",
            gap: 5,
            zIndex: 90,
            opacity: 0.9,
          }}
        >
          📢 <span>Report</span>
        </button>
      )}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
