"use client";
import { useState, useEffect } from "react";

import LandingScreen from "@/components/screens/LandingScreen";
import FarmerHome from "@/components/screens/farmer/FarmerHome";
import AddProduceScreen from "@/components/screens/farmer/AddProduceScreen";
import AddFarmerScreen from "@/components/screens/farmer/AddFarmerScreen";
import FarmerProduceDetail from "@/components/screens/farmer/FarmerProduceDetail";
import ConsumerHome from "@/components/screens/consumer/ConsumerHome";
import ProductDetail from "@/components/screens/consumer/ProductDetail";
import CartScreen from "@/components/screens/consumer/CartScreen";
import CheckoutScreen from "@/components/screens/consumer/CheckoutScreen";
import OrderSuccessScreen from "@/components/screens/OrderSuccessScreen";
import AdminScreen from "@/components/screens/admin/AdminScreen";
import { BottomTabBar, Toast } from "@/components/ui";

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

export default function FarmMarket() {
  const [screen, setScreen] = useState("landing");
  const [params, setParams] = useState({});
  const [role, setRole] = useState("");
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
    if (r === "farmer")    nav("farmer-home");
    else if (r === "consumer" || r === "community") nav("consumer-home");
    else if (r === "admin") nav("admin");
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
  const cartCount = cart.reduce((s, i) => s + (i.qty || 1), 0);
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
    { id: "farmer-home",  icon: "🌾", label: "My Farm" },
    { id: "add-produce",  icon: "➕", label: "Add Produce" },
    { id: "landing",      icon: "🔄", label: "Switch" },
  ];
  const consumerTabs = [
    { id: "consumer-home", icon: "🏪", label: "Market" },
    { id: "cart",          icon: "🛒", label: "Cart", badge: cartCount },
    { id: "landing",       icon: "🔄", label: "Switch" },
  ];
  const adminTabs = [
    { id: "admin",   icon: "⚙️", label: "Admin" },
    { id: "landing", icon: "🔄", label: "Switch" },
  ];

  const tabs = role === "farmer" ? farmerTabs : role === "admin" ? adminTabs : consumerTabs;

  const handleTabSwitch = (tabId) => {
    if (tabId === "landing") { setRole(""); nav("landing"); }
    else nav(tabId, tabId === "add-produce" ? { farmerId: farmers[0]?._id } : {});
  };

  /* ─── Screen renderer ─── */
  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return <LandingScreen onRole={handleRole} />;

      case "farmer-home":
        return (
          <FarmerHome
            farmers={farmers}
            produce={produce}
            onNav={(s, p) => { if (s === "add-farmer") nav("add-farmer", p); else nav(s, p); }}
          />
        );

      case "add-produce":
        return (
          <AddProduceScreen
            farmers={farmers}
            initialFarmerId={params.farmerId}
            onSave={() => { refreshProduce(); nav("farmer-home"); }}
            onBack={() => nav("farmer-home")}
            showToast={showToast}
          />
        );

      case "add-farmer":
        return (
          <AddFarmerScreen
            onSave={(farmer) => { refreshFarmers(); nav("farmer-home"); }}
            onBack={() => nav("farmer-home")}
            showToast={showToast}
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
          />
        );

      default:
        return <LandingScreen onRole={handleRole} />;
    }
  };

  const showBottomBar = role && screen !== "landing" && screen !== "order-success" && screen !== "checkout";

  return (
    <div className="app-shell" style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh",
      background: "var(--cream)", position: "relative"
    }}>
      {renderScreen()}
      {showBottomBar && (
        <BottomTabBar tabs={tabs} activeTab={screen} onTab={handleTabSwitch} />
      )}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}
