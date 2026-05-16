"use client";
import { useState, useEffect } from "react";

/* ─── NavBar ─────────────────────────────────────────────── */
export function NavBar({ title, sub, onBack, right }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "var(--gd)", color: "#fff",
      padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,.18)"
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,.15)", border: "none", color: "#fff",
          borderRadius: 8, padding: "4px 10px", fontSize: 18, cursor: "pointer", lineHeight: 1
        }}>←</button>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 1 }}>{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ─── BottomTabBar ───────────────────────────────────────── */
export function BottomTabBar({ tabs, activeTab, onTab }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "#fff", borderTop: "1px solid var(--border)",
      display: "flex", zIndex: 200, paddingBottom: "env(safe-area-inset-bottom, 0)"
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onTab(tab.id)} style={{
          flex: 1, padding: "8px 4px 6px", background: "none", border: "none",
          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          color: activeTab === tab.id ? "var(--gd)" : "var(--muted)",
          fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 600,
          transition: "color .2s", position: "relative"
        }}>
          <span style={{ fontSize: 20, lineHeight: 1, position: "relative" }}>
            {tab.icon}
            {tab.badge > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -6,
                background: "var(--terra)", color: "#fff", borderRadius: "50%",
                width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700
              }}>{tab.badge}</span>
            )}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Btn ────────────────────────────────────────────────── */
const btnStyles = {
  primary: { background: "var(--gd)", color: "#fff" },
  terra:   { background: "var(--terra)", color: "#fff" },
  gold:    { background: "var(--gold)", color: "var(--brown)" },
  outline: { background: "transparent", color: "var(--gd)", border: "2px solid var(--gd)" },
  ai:      { background: "linear-gradient(135deg, var(--gm), var(--gl))", color: "#fff" },
  ghost:   { background: "transparent", color: "var(--muted)" },
};
const sizeStyles = {
  sm: { padding: "6px 14px", fontSize: 13 },
  md: { padding: "10px 22px", fontSize: 14 },
  lg: { padding: "14px 28px", fontSize: 16 },
};

export function Btn({ variant = "primary", size = "md", block, onClick, disabled, loading, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...btnStyles[variant],
        ...sizeStyles[size],
        borderRadius: 30, fontWeight: 700, fontFamily: "'Nunito', sans-serif",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        border: "none", cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "opacity .2s, transform .15s",
        width: block ? "100%" : undefined,
        ...(variant === "ai" ? { backgroundImage: btnStyles.ai.background, background: undefined } : {}),
        ...style
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

/* ─── Card ───────────────────────────────────────────────── */
export function Card({ children, padding = 16, onClick, hover, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: "var(--r)", boxShadow: "var(--shadow)",
        padding, cursor: onClick ? "pointer" : undefined,
        transition: hover ? "transform .2s, box-shadow .2s" : undefined,
        ...(hover ? { ":hover": { transform: "translateY(-2px)", boxShadow: "var(--shadow-lg)" } } : {}),
        ...style
      }}
      onMouseEnter={e => hover && (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => hover && (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────── */
const badgeColors = {
  green: { background: "var(--gs)", color: "var(--gd)" },
  terra: { background: "var(--terra-s)", color: "var(--terra)" },
  gold:  { background: "var(--gold-s)", color: "#7A5A00" },
  brown: { background: "var(--parch)", color: "var(--brown)" },
};

export function Badge({ variant = "green", children, style }) {
  return (
    <span style={{
      ...badgeColors[variant],
      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      display: "inline-block", ...style
    }}>
      {children}
    </span>
  );
}

/* ─── FormGroup ──────────────────────────────────────────── */
export function FormGroup({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 6 }}>
          {label}
        </label>
      )}
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────── */
const inputBase = {
  width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)",
  border: "1.5px solid var(--border)", background: "#fff", fontSize: 14,
  color: "var(--ink)", fontFamily: "'Nunito', sans-serif",
  transition: "border-color .2s"
};

export function Input({ type = "text", placeholder, value, onChange, style, ...rest }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ ...inputBase, ...style }} {...rest}
      onFocus={e => (e.target.style.borderColor = "var(--gm)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

/* ─── Select ─────────────────────────────────────────────── */
export function Select({ value, onChange, children, style, ...rest }) {
  return (
    <select
      value={value} onChange={onChange}
      style={{ ...inputBase, appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M0 0l6 8 6-8z' fill='%237A6652'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32, ...style }}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ─── Textarea ───────────────────────────────────────────── */
export function Textarea({ value, onChange, placeholder, rows = 4, style }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ ...inputBase, resize: "vertical", ...style }}
      onFocus={e => (e.target.style.borderColor = "var(--gm)")}
      onBlur={e => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

/* ─── Toast ──────────────────────────────────────────────── */
export function Toast({ message, type = "success" }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: type === "success" ? "var(--gd)" : "var(--terra)",
      color: "#fff", padding: "12px 24px", borderRadius: 30,
      fontWeight: 600, fontSize: 14, zIndex: 9999,
      boxShadow: "var(--shadow-lg)", whiteSpace: "nowrap",
      animation: "fadeInOut .3s ease"
    }}>
      {message}
    </div>
  );
}

/* ─── EmptyState ─────────────────────────────────────────── */
export function EmptyState({ icon = "📭", title, sub, action, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--brown)", marginBottom: 8 }}>{title}</h3>
      {sub && <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 20 }}>{sub}</p>}
      {action && <Btn onClick={action}>{actionLabel}</Btn>}
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────── */
export function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)",
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block", animation: "spin .7s linear infinite"
    }} />
  );
}

/* ─── Divider ────────────────────────────────────────────── */
export function Divider({ style }) {
  return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0", ...style }} />;
}

/* ─── AIPanel ────────────────────────────────────────────── */
export function AIPanel({ title, body }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--gs), #fff)",
      border: "1.5px solid var(--gl)", borderRadius: "var(--r)",
      padding: "14px 16px"
    }}>
      {title && (
        <div style={{ fontWeight: 700, color: "var(--gd)", fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          🤖 {title}
        </div>
      )}
      <p style={{ color: "var(--brown)", fontSize: 14, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

/* ─── Keyframes ──────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const style = document.getElementById("ui-keyframes");
  if (!style) {
    const s = document.createElement("style");
    s.id = "ui-keyframes";
    s.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeInOut { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    `;
    document.head.appendChild(s);
  }
}
