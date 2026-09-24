# 5serving FarmMarket — Developer Guide

> A complete walkthrough of how this app is built, from first principles to production.
> Written for developers who want to understand and build similar apps.

---

## Table of Contents

1. [What We Built and Why](#1-what-we-built-and-why)
2. [Tech Stack — Every Choice Explained](#2-tech-stack--every-choice-explained)
3. [Project Setup from Scratch](#3-project-setup-from-scratch)
4. [Project Structure Explained](#4-project-structure-explained)
5. [Frontend Architecture — How the App Shell Works](#5-frontend-architecture--how-the-app-shell-works)
6. [Building Screens and Navigation](#6-building-screens-and-navigation)
7. [API Routes — The Backend Layer](#7-api-routes--the-backend-layer)
8. [Database with MongoDB and Mongoose](#8-database-with-mongodb-and-mongoose)
9. [Authentication — OTP Login and Session Tokens](#9-authentication--otp-login-and-session-tokens)
10. [State Management — React Only, No Redux](#10-state-management--react-only-no-redux)
11. [AI Integration with Anthropic Claude](#11-ai-integration-with-anthropic-claude)
12. [Payment Integration with Razorpay](#12-payment-integration-with-razorpay)
13. [PWA — Making the App Installable](#13-pwa--making-the-app-installable)
14. [Security — What We Did and Why](#14-security--what-we-did-and-why)
15. [Design System — CSS Variables and No Tailwind](#15-design-system--css-variables-and-no-tailwind)
16. [Deployment on Vercel](#16-deployment-on-vercel)
17. [Building a Feature End to End](#17-building-a-feature-end-to-end)
18. [Common Patterns Used Throughout the Code](#18-common-patterns-used-throughout-the-code)

---

## 1. What We Built and Why

5serving FarmMarket is a **Progressive Web App (PWA)** — a website that behaves like a mobile app. Users can install it on their phone from the browser, it works offline (partially), and it feels native.

The app connects three types of users:
- **Farmers** who list their produce
- **Buyers** who browse and order
- **Admins** who manage everything

### Why a PWA and not a native app?

| Factor | Native App | PWA |
|---|---|---|
| Installation | App Store (slow, costly) | Direct from browser (instant) |
| Update delivery | User must update | Automatic on next visit |
| Build cost | Separate iOS + Android | One codebase |
| Works offline | Yes | Partially (with service worker) |
| Access device features | Full | Camera, GPS, notifications |

For reaching farmers in rural India with low-end Android phones, a PWA is faster to ship, easier to update, and avoids the App Store approval process.

---

## 2. Tech Stack — Every Choice Explained

### Next.js 16 (App Router)

Next.js is a React framework. The **App Router** (introduced in Next.js 13) is the modern way to build Next.js apps.

**Why Next.js over plain React?**
- Gives us both frontend (React components) and backend (API routes) in one project
- Server-side rendering for fast initial loads
- Built-in file-based routing
- Easy deployment on Vercel (same company)

**What is the App Router?**
The App Router uses the `app/` directory. Every folder with a `page.js` becomes a URL route. Every folder with a `route.js` becomes an API endpoint.

```
app/
  page.js          → https://yourapp.com/
  admin/page.js    → https://yourapp.com/admin
  api/
    farmers/
      route.js     → https://yourapp.com/api/farmers
```

### React 19

React is the UI library. We use:
- **`useState`** — store data that changes (cart items, current screen, form values)
- **`useEffect`** — run code when the component loads or when something changes (fetch data from API)

### MongoDB Atlas + Mongoose

MongoDB is a **NoSQL database** — data is stored as JSON-like documents, not rows in a table. Atlas is MongoDB's cloud hosting service.

**Why MongoDB over SQL (PostgreSQL, MySQL)?**
- JSON-like documents match our JavaScript objects naturally
- No rigid schema required upfront — easy to add fields later
- Atlas free tier is generous for small apps
- Mongoose adds structure (schemas, validation) on top of MongoDB

### Anthropic Claude (AI)

We use Claude claude-sonnet-4-20250514 to generate produce descriptions and nutrition tips. We call it server-side only — never from the browser — to keep the API key secret.

### Razorpay

India's most popular payment gateway. Supports UPI, cards, and net banking. We use their JavaScript SDK for the payment popup and their Node.js SDK to verify payments server-side.

### @ducanh2912/next-pwa

A library that wraps next-pwa and automatically generates:
- A **service worker** (handles offline caching)
- **Web App Manifest** (tells the browser this is installable)

### Vercel

The deployment platform built by the same team as Next.js. Deploying is a single command: `npx vercel --prod`. It handles SSL, CDN, and serverless function hosting automatically.

---

## 3. Project Setup from Scratch

If you were building this from zero, here's every step:

### Step 1: Create the Next.js project

```bash
npx create-next-app@latest my-farmmarket
# Choose: TypeScript? No  ESLint? Yes  App Router? Yes
cd my-farmmarket
```

### Step 2: Install dependencies

```bash
npm install mongoose @anthropic-ai/sdk razorpay @ducanh2912/next-pwa
```

### Step 3: Set up environment variables

Create `.env.local` in the project root:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
ANTHROPIC_API_KEY=sk-ant-...
SESSION_SECRET=any-long-random-string-at-least-32-chars
ADMIN_PHONES=9876543210
SEED_SECRET=any-secret-string
FAST2SMS_API_KEY=your-fast2sms-key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

> Variables starting with `NEXT_PUBLIC_` are safe to expose to the browser.
> All others stay server-side only.

### Step 4: Configure next-pwa

In `next.config.js`:

```js
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

module.exports = withPWA({
  // your normal Next.js config here
});
```

### Step 5: Create the PWA manifest

In `public/manifest.json`:

```json
{
  "name": "5serving FarmMarket",
  "short_name": "FarmMarket",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDFAF3",
  "theme_color": "#1B4332",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 4. Project Structure Explained

```
5serving-farmmarket/
│
├── app/                        ← Next.js App Router
│   ├── layout.tsx              ← Root layout (wraps every page)
│   ├── page.tsx                ← Home page — renders <FarmMarket />
│   ├── globals.css             ← Design tokens (CSS variables)
│   └── api/                    ← Backend API routes
│       ├── ai/route.js         ← POST /api/ai
│       ├── auth/
│       │   ├── send-otp/route.js
│       │   └── verify-otp/route.js
│       ├── farmers/
│       │   ├── route.js        ← GET /api/farmers, POST /api/farmers
│       │   ├── [id]/route.js   ← GET/PATCH/DELETE /api/farmers/123
│       │   └── [id]/status/route.js
│       └── ...
│
├── components/
│   ├── FarmMarket.jsx          ← The entire app UI lives here
│   ├── ui.jsx                  ← Reusable UI components
│   └── screens/                ← One file per screen
│       ├── auth/OTPAuthScreen.jsx
│       ├── farmer/FarmerHome.jsx
│       ├── consumer/ConsumerHome.jsx
│       └── admin/AdminScreen.jsx
│
├── models/                     ← Mongoose database schemas
│   ├── Farmer.js
│   ├── Produce.js
│   ├── Order.js
│   ├── Buyer.js
│   ├── OTP.js
│   ├── Community.js
│   └── Report.js
│
├── lib/
│   ├── mongoose.js             ← Database connection singleton
│   ├── auth.js                 ← Server: token create/verify
│   └── clientAuth.js           ← Client: localStorage token helpers
│
└── public/
    ├── manifest.json
    ├── icon-192.png
    └── icon-512.png
```

**Key insight:** The `app/` directory is the backend. The `components/` directory is the frontend. They talk to each other through `fetch()` calls to the API routes.

---

## 5. Frontend Architecture — How the App Shell Works

The entire UI lives in one component: `FarmMarket.jsx`. This is intentional — it acts as the **app shell** that manages:
- Which screen is currently visible
- Shared state (logged-in farmer, cart, toast messages)
- Navigation between screens

### The Screen Pattern

Instead of Next.js page routing (which reloads the page), we use a single `screen` state variable:

```jsx
// FarmMarket.jsx
const [screen, setScreen] = useState("landing");
const [params, setParams]  = useState({});

const nav = (screenKey, paramsObj = {}) => {
  setScreen(screenKey);
  setParams(paramsObj);
};
```

And a `renderScreen()` function that returns the right component:

```jsx
const renderScreen = () => {
  switch (screen) {
    case "landing":       return <LandingScreen onRole={handleRole} />;
    case "otp-auth":      return <OTPAuthScreen role={params.role} onVerified={...} />;
    case "farmer-home":   return <FarmerHome farmers={farmers} produce={produce} />;
    case "consumer-home": return <ConsumerHome produce={produce} />;
    case "admin":         return <AdminScreen />;
    // ...
    default:              return <LandingScreen onRole={handleRole} />;
  }
};
```

**Why this pattern instead of Next.js routing?**

For a mobile PWA, full page navigation causes a flash of white and feels unnatural. By keeping everything in one component and just swapping which screen renders, transitions feel instant and smooth — just like a native app.

**How to pass data between screens:**

Use the `params` object in `nav()`:

```jsx
// From ConsumerHome, navigate to ProductDetail and pass the product
nav("product-detail", { product: selectedItem });

// In renderScreen(), access it via params
case "product-detail":
  return <ProductDetail product={params.product} />;
```

### The Layout

`app/layout.tsx` wraps every page. It loads fonts and links the PWA manifest:

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B4332" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display..." rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx` is dead simple — it just renders the FarmMarket component:

```tsx
import FarmMarket from "@/components/FarmMarket";
export default function Home() {
  return <FarmMarket />;
}
```

---

## 6. Building Screens and Navigation

Every screen is a React component that receives props from FarmMarket and calls `onNav` (or similar callbacks) to navigate away.

### Anatomy of a Screen Component

```jsx
// components/screens/farmer/FarmerHome.jsx
"use client";  // ← Required for all UI components
import { useState } from "react";
import { NavBar, Card, Btn } from "@/components/ui";

export default function FarmerHome({ farmers, produce, currentFarmer, onNav }) {
  // Local state — only this screen cares about it
  const [selectedId, setSelectedId] = useState(currentFarmer?._id || "");

  const myProduce = produce.filter(p => p.farmerId === selectedId);

  return (
    <div style={{ paddingBottom: 80 }}>  {/* paddingBottom leaves room for tab bar */}
      <NavBar title="My Farm" sub="5serving FarmMarket" />

      {myProduce.map(item => (
        <Card key={item._id} onClick={() => onNav("farmer-produce-detail", { produce: item })}>
          {item.name}
        </Card>
      ))}

      <Btn onClick={() => onNav("add-produce", { farmerId: selectedId })}>
        + Add Produce
      </Btn>
    </div>
  );
}
```

**Things to notice:**
1. `"use client"` at the top — required for any component that uses hooks or event handlers
2. Props come from FarmMarket — the screen doesn't fetch its own data
3. Navigation via `onNav()` callback — the screen doesn't know about other screens
4. `paddingBottom: 80` — leaves space above the fixed bottom tab bar

### The Reusable UI Library

`components/ui.jsx` contains small, reusable building blocks used by every screen:

```jsx
// NavBar — top bar with title and optional back button
export function NavBar({ title, sub, onBack, right }) {
  return (
    <div style={{ background: "linear-gradient(135deg, var(--gd), var(--gm))", padding: "20px 16px" }}>
      {onBack && <button onClick={onBack}>← Back</button>}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
      {right}
    </div>
  );
}

// Btn — styled button with loading state
export function Btn({ children, onClick, loading, variant = "primary", block }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: block ? "100%" : "auto",
        background: variant === "primary" ? "var(--gd)" : "transparent",
        // ...
      }}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

// Card, Badge, Toast, Spinner, EmptyState, Divider...
```

---

## 7. API Routes — The Backend Layer

In Next.js App Router, any file named `route.js` inside `app/api/` becomes an HTTP endpoint.

### Basic API Route Structure

```js
// app/api/farmers/route.js
import connectDB from "@/lib/mongoose";
import Farmer from "@/models/Farmer";

// Handles GET /api/farmers
export async function GET(request) {
  try {
    await connectDB();
    const farmers = await Farmer.find({ active: true, status: "approved" });
    return Response.json(farmers);         // ← Returns JSON
  } catch (err) {
    return Response.json(                  // ← Always return structured errors
      { error: "Failed to fetch farmers" },
      { status: 500 }
    );
  }
}

// Handles POST /api/farmers
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();     // ← Read the request body
    const farmer = await Farmer.create(body);
    return Response.json(farmer, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Failed to create farmer" }, { status: 500 });
  }
}
```

### Dynamic Route Parameters

For routes like `/api/farmers/123`:

```js
// app/api/farmers/[id]/route.js

export async function GET(request, { params: rawParams }) {
  const params = await rawParams;    // ← Must await in Next.js 15+
  const { id } = params;

  const farmer = await Farmer.findById(id);
  // ...
}
```

### Reading Query Parameters

For URLs like `/api/farmers?status=approved`:

```js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");    // "approved"
  // ...
}
```

### HTTP Status Codes

Always use the right status code:

| Code | Meaning | When to use |
|---|---|---|
| 200 | OK | Successful GET or update |
| 201 | Created | Successful POST (new resource created) |
| 400 | Bad Request | Invalid input from client |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Logged in but not allowed |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Something went wrong on our end |

---

## 8. Database with MongoDB and Mongoose

### The Connection Singleton

Database connections are expensive. In a serverless environment (Vercel), each function invocation is a new process — without caching, we'd open a new connection on every API call.

```js
// lib/mongoose.js
import mongoose from "mongoose";

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) return cached.conn;    // ← Reuse existing connection

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI.trim();
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

**How it works:**
- `global.mongoose` persists between function invocations in the same process
- First call: creates the connection and caches it
- Subsequent calls: returns the cached connection instantly

### Defining a Model (Schema)

A **schema** defines the shape of your data — what fields exist, their types, and defaults.

```js
// models/Farmer.js
import mongoose from "mongoose";

const FarmerSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },        // Required field
    village:  { type: String, required: true },
    district: { type: String, default: "" },           // Optional with default
    state:    { type: String, default: "Karnataka" },
    phone:    { type: String, default: "" },
    crops:    [String],                                // Array of strings
    active:   { type: Boolean, default: true },
    status:   {
      type: String,
      enum: ["pending", "approved", "rejected"],       // Only these values allowed
      default: "pending"
    },
  },
  { timestamps: true }    // ← Automatically adds createdAt and updatedAt
);

// Prevent model re-registration in development (hot reload)
export default mongoose.models.Farmer || mongoose.model("Farmer", FarmerSchema);
```

### Common Mongoose Operations

```js
// Create
const farmer = await Farmer.create({ name: "Ramu", village: "Hassan" });

// Find all matching
const farmers = await Farmer.find({ status: "approved", active: true });

// Find one
const farmer = await Farmer.findOne({ phone: "9876543210" });

// Find by MongoDB _id
const farmer = await Farmer.findById("64abc123...");

// Update and return the new document
const updated = await Farmer.findByIdAndUpdate(
  id,
  { status: "approved" },
  { new: true }    // ← Return updated doc, not original
);

// Soft delete (don't actually delete — just set active: false)
await Farmer.findByIdAndUpdate(id, { active: false });

// Hard delete
await Farmer.findByIdAndDelete(id);

// Count
const count = await Farmer.countDocuments({ status: "pending" });
```

### MongoDB _id

Every MongoDB document gets an automatic `_id` field — a unique ObjectId that looks like `"64abc123def456..."`. This is different from a SQL auto-increment integer ID.

In your frontend code, always handle both `item._id` and `item.id` since Mongoose sometimes serializes it differently:

```js
const id = item._id || item.id;
```

---

## 9. Authentication — OTP Login and Session Tokens

This app uses **phone OTP authentication** — no passwords. Here's the complete flow:

### Step 1: User Requests an OTP

```
User enters phone → POST /api/auth/send-otp → OTP generated, saved to DB, sent via SMS
```

```js
// app/api/auth/send-otp/route.js
import OTP from "@/models/OTP";

export async function POST(request) {
  const { phone, role } = await request.json();

  // Rate limiting — one OTP per 60 seconds
  const recent = await OTP.findOne({
    phone, role, used: false,
    createdAt: { $gt: new Date(Date.now() - 60_000) }
  });
  if (recent) return Response.json({ error: "Wait 60 seconds" }, { status: 429 });

  // Generate and store OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);  // 10 minutes
  await OTP.deleteMany({ phone, role, used: false });        // Delete old ones
  await OTP.create({ phone, code, role, expiresAt });

  // Send via SMS (Fast2SMS)
  await sendSMS(phone, code);

  return Response.json({ success: true });
}
```

The OTP model has a **TTL index** — MongoDB automatically deletes expired OTP documents:

```js
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### Step 2: User Verifies the OTP

```
User enters 6 digits → POST /api/auth/verify-otp → OTP checked, session token returned
```

```js
// app/api/auth/verify-otp/route.js
import { createToken } from "@/lib/auth";

export async function POST(request) {
  const { phone, code, role } = await request.json();

  const record = await OTP.findOne({
    phone, code, role,
    used: false,
    expiresAt: { $gt: new Date() }   // Not expired
  });

  if (!record) return Response.json({ error: "Invalid or expired OTP" }, { status: 400 });

  record.used = true;                // Prevent reuse
  await record.save();

  const farmer = role === "farmer"
    ? await Farmer.findOne({ phone, active: true })
    : null;

  // Generate session token
  const token = createToken({ phone, role, farmerId: farmer?._id?.toString() || null });

  return Response.json({ success: true, token, farmer });
}
```

### Step 3: Session Token (Custom JWT)

Instead of using a library, we implement our own HMAC-SHA256 signed token — no extra dependencies needed.

```js
// lib/auth.js
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET;

export function createToken(payload) {
  const data = JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,  // 30 days
  });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(encoded).digest();
  return `${encoded}.${sig.toString("base64url")}`;
}

export function verifyToken(token) {
  const dotIdx = token.lastIndexOf(".");
  const encoded = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);

  // Verify signature using timing-safe comparison
  const expected = crypto.createHmac("sha256", SECRET).update(encoded).digest();
  const provided = Buffer.from(sigB64, "base64url");
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;  // ← Prevents timing attacks

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  if (payload.exp < Date.now()) return null;  // Expired
  return payload;
}

// Extract token from request headers
export function getAuth(request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}
```

**What is a timing attack?** A regular string comparison (`a === b`) stops at the first different character — an attacker can measure how long it takes and guess characters one by one. `timingSafeEqual` always takes the same amount of time regardless of where the strings differ.

### Step 4: Client Stores and Sends the Token

```js
// lib/clientAuth.js — runs in the browser
const TOKEN_KEY = "5s_session";

export function getSessionToken() {
  if (typeof window === "undefined") return null;  // SSR guard
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function authHeaders() {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
```

After OTP verify:
```js
// OTPAuthScreen.jsx
const data = await res.json();
if (data.token) setSessionToken(data.token);  // Save to localStorage
```

When making protected API calls:
```js
// Any screen that modifies data
const res = await fetch("/api/produce", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...authHeaders() },
  body: JSON.stringify(body),
});
```

### Step 5: API Routes Check the Token

```js
// app/api/produce/[id]/route.js
import { getAuth } from "@/lib/auth";

export async function PATCH(request, { params: rawParams }) {
  const auth = getAuth(request);

  // Must be logged in
  if (!auth) return Response.json({ error: "Authentication required" }, { status: 401 });

  const params = await rawParams;
  const existing = await Produce.findById(params.id);

  // Must own this produce (or be admin)
  if (auth.role !== "admin" && auth.farmerId !== existing.farmerId?.toString()) {
    return Response.json({ error: "You can only update your own produce" }, { status: 403 });
  }

  // ... proceed with update
}
```

---

## 10. State Management — React Only, No Redux

This app uses only `useState` and `useEffect`. No Redux, no Zustand, no Context API. This is a deliberate choice — keep it simple.

### useState — Local Component State

```jsx
const [cart, setCart] = useState([]);          // Array
const [loading, setLoading] = useState(false); // Boolean
const [farmer, setFarmer] = useState(null);    // Object or null
const [screen, setScreen] = useState("landing"); // String
```

**Updating state correctly:**

```jsx
// ✅ Correct: use previous state when the new value depends on the old value
setCart(prev => [...prev, newItem]);
setCart(prev => prev.filter(item => item._id !== id));
setCart(prev => prev.map(item =>
  item._id === id ? { ...item, qty: newQty } : item
));

// ❌ Wrong: reading stale state
cart.push(newItem);  // Never mutate state directly
setCart([...cart, newItem]);  // May use stale `cart`
```

### useEffect — Side Effects

```jsx
// Run once when component mounts (empty dependency array)
useEffect(() => {
  fetch("/api/farmers")
    .then(r => r.json())
    .then(data => setFarmers(data));
}, []);

// Run when `phone` changes
useEffect(() => {
  if (!phone) return;
  fetchOrdersForPhone(phone);
}, [phone]);

// Cleanup (e.g., timers, subscriptions)
useEffect(() => {
  const timer = setTimeout(() => setToast(""), 2500);
  return () => clearTimeout(timer);  // ← Cleanup function
}, [toast.message]);
```

### Lifting State Up

When two sibling screens need the same data, the state lives in their parent (FarmMarket):

```jsx
// FarmMarket.jsx — shared state at the top level
const [farmers, setFarmers] = useState(SEED_FARMERS);
const [produce, setProduce] = useState(SEED_PRODUCE);
const [cart, setCart] = useState([]);
const [farmer, setFarmer] = useState(null);  // Logged-in farmer

// Passed down to screens that need them
<FarmerHome farmers={farmers} produce={produce} currentFarmer={farmer} />
<ConsumerHome produce={produce} cart={cart} onAddToCart={addToCart} />
```

---

## 11. AI Integration with Anthropic Claude

### Server-Side Only

The API key must never reach the browser. We create a proxy route:

```js
// app/api/ai/route.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();  // Reads ANTHROPIC_API_KEY from env automatically

export async function POST(request) {
  const { prompt, system } = await request.json();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: system || "You are a helpful assistant for 5serving FarmMarket.",
    messages: [{ role: "user", content: prompt }],
  });

  return Response.json({ text: message.content[0].text });
}
```

### Calling from the Frontend

```jsx
// AddProduceScreen.jsx
const handleAIDescribe = async () => {
  setAiLoading(true);
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Write a 2-sentence description for: ${form.name}, ${form.category}, 
                 grown by ${farmer.name} in ${farmer.village}`,
        system: "You are a warm copywriter for an Indian farmers marketplace. Keep it under 60 words.",
      }),
    });
    const data = await res.json();
    set("description", data.text);
  } catch {
    showToast("AI unavailable right now", "error");
  } finally {
    setAiLoading(false);
  }
};
```

### Prompt Engineering Tips

1. **Be specific about format**: "2 sentences, under 60 words"
2. **Give context**: "Indian farmers marketplace, rural Karnataka"
3. **Define tone**: "warm, practical, not clinical"
4. **Use the system prompt** for instructions that apply to all calls
5. **Use the user prompt** for the specific request

---

## 12. Payment Integration with Razorpay

Razorpay has two parts: a frontend script that shows the payment popup, and a backend that creates and verifies orders.

### Step 1: Create a Razorpay Order (Server)

```js
// app/api/payment/create-order/route.js
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  const { amount } = await request.json();  // Amount in paise (₹1 = 100 paise)

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),  // Convert rupees to paise
    currency: "INR",
    receipt: `order_${Date.now()}`,
  });

  return Response.json({ orderId: order.id, amount: order.amount });
}
```

### Step 2: Open Payment Popup (Frontend)

```jsx
// Load Razorpay script dynamically
const loadRazorpay = () => new Promise(resolve => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  document.body.appendChild(script);
});

const handleRazorpayPayment = async () => {
  await loadRazorpay();

  // Create order on our server
  const res = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: totalAmount }),
  });
  const { orderId } = await res.json();

  // Open Razorpay popup
  const rzp = new window.Razorpay({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    order_id: orderId,
    amount: totalAmount * 100,
    currency: "INR",
    name: "5serving FarmMarket",
    handler: async (response) => {
      // Payment succeeded — verify on server
      await verifyPayment(response);
    },
  });
  rzp.open();
};
```

### Step 3: Verify Payment Signature (Server)

After payment, Razorpay sends a signature. We verify it matches what we expect:

```js
// app/api/payment/verify/route.js
import crypto from "crypto";

export async function POST(request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

  // Generate expected signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return Response.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // Payment is genuine — update order in database
  // ...
}
```

**Why verify the signature?** Anyone could send a fake success response to your server. The signature is cryptographically generated using your secret key — only Razorpay can create it. Verifying it proves the payment is real.

---

## 13. PWA — Making the App Installable

### What Makes a PWA?

1. **HTTPS** — must be served over HTTPS (Vercel handles this)
2. **Web App Manifest** — a JSON file describing the app
3. **Service Worker** — a JavaScript file that runs in the background

### Web App Manifest

```json
{
  "name": "5serving FarmMarket",
  "short_name": "FarmMarket",
  "start_url": "/",
  "display": "standalone",        // ← No browser UI, looks like native app
  "background_color": "#FDFAF3",
  "theme_color": "#1B4332",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Reference it in `layout.tsx`:
```tsx
<link rel="manifest" href="/manifest.json" />
```

### Service Worker (via next-pwa)

The service worker intercepts network requests and can serve cached responses when offline. `next-pwa` generates it automatically — you just configure it in `next.config.js`:

```js
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",           // ← Output SW to public/sw.js
  cacheOnFrontEndNav: true, // ← Cache pages as user navigates
});
```

### Install Prompt

When a user visits a PWA on mobile, the browser shows an "Add to Home Screen" banner automatically. You can also trigger it programmatically:

```js
// Listen for the install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  // Show your own install button
  setInstallPrompt(e);
});

// When user clicks your install button
installPrompt.prompt();
```

---

## 14. Security — What We Did and Why

### 1. Environment Variables

**Rule:** API keys never go to the browser.

```bash
# ✅ Server-only (never sent to browser)
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=abc123...

# ✅ Safe to expose (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
```

Next.js only exposes `NEXT_PUBLIC_` variables in the browser bundle. Everything else stays server-side.

### 2. Authentication vs Authorization

- **Authentication** = proving who you are (OTP login)
- **Authorization** = checking if you're allowed to do something

```js
// Authentication — are you logged in?
const auth = getAuth(request);
if (!auth) return Response.json({ error: "Login required" }, { status: 401 });

// Authorization — are you allowed to edit THIS produce?
if (auth.role !== "admin" && auth.farmerId !== produce.farmerId) {
  return Response.json({ error: "Not your produce" }, { status: 403 });
}
```

### 3. Rate Limiting

Prevent abuse by limiting how often users can call expensive endpoints:

```js
// Only 1 OTP per 60 seconds per phone number
const recent = await OTP.findOne({
  phone,
  createdAt: { $gt: new Date(Date.now() - 60_000) }
});
if (recent) return Response.json({ error: "Wait 60 seconds" }, { status: 429 });
```

### 4. Input Validation

Never trust what users send:

```js
// Validate phone format
if (!/^\d{10}$/.test(phone)) {
  return Response.json({ error: "10-digit number required" }, { status: 400 });
}

// Whitelist allowed fields — don't just spread body into database
const allowed = {};
if (body.quantity !== undefined) allowed.quantity = body.quantity;
if (body.price !== undefined) allowed.price = body.price;
// Ignore any extra fields the user might have added
```

### 5. Mongoose Prevents SQL Injection

Because we use Mongoose (an ORM), user input never gets concatenated into a query string. Mongoose parameterizes everything automatically:

```js
// ✅ Safe — Mongoose handles escaping
const farmer = await Farmer.findOne({ phone: userInput });

// ❌ Dangerous — if you ever use raw queries with string concatenation
db.query(`SELECT * FROM farmers WHERE phone = '${userInput}'`);
```

### 6. Timing-Safe Comparisons

When comparing secrets (tokens, passwords), use `crypto.timingSafeEqual` to prevent timing attacks:

```js
// ✅ Timing-safe
if (!crypto.timingSafeEqual(provided, expected)) return null;

// ❌ Leaks timing information
if (token !== expectedToken) return null;
```

---

## 15. Design System — CSS Variables and No Tailwind

### Why No Tailwind?

Tailwind adds thousands of utility classes to your HTML. For a mobile PWA with a tight design system, hand-crafted CSS variables give more control and result in a smaller bundle.

### CSS Variables (Design Tokens)

Define once in `globals.css`, use everywhere:

```css
:root {
  --gd: #1B4332;      /* Forest green — primary brand */
  --gm: #2D6A4F;      /* Mid green */
  --gl: #52B788;      /* Light green */
  --gs: #D8F3DC;      /* Green surface */
  --terra: #C84B2F;   /* Terracotta — prices, CTAs */
  --gold: #E9A100;    /* Golden harvest */
  --cream: #FDFAF3;   /* Background */
  --parch: #F5EDDA;   /* Card surfaces */
  --brown: #4A2810;   /* Deep brown — text */
  --muted: #7A6652;   /* Secondary text */
  --border: #E0D4C0;  /* Borders */

  --r: 16px;          /* Border radius — cards */
  --r-sm: 10px;       /* Border radius — inputs */
  --shadow: 0 2px 12px rgba(74,40,16,.08);
}
```

Use them in inline styles or CSS:

```jsx
<div style={{ background: "var(--cream)", borderRadius: "var(--r)" }}>
  <h1 style={{ color: "var(--brown)", fontFamily: "'Playfair Display', serif" }}>
    Hello
  </h1>
  <p style={{ color: "var(--muted)" }}>Secondary text</p>
  <button style={{ background: "var(--gd)", color: "#fff" }}>
    Primary button
  </button>
</div>
```

### Why Inline Styles?

For a single-developer project, inline styles:
- Keep styles and markup together — easy to read
- No class name collisions
- No build-time CSS extraction needed
- Easy to make dynamic (`color: isActive ? "var(--gd)" : "var(--muted)"`)

For a larger team, consider CSS modules or styled-components instead.

---

## 16. Deployment on Vercel

### Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (first time — sets up the project)
vercel --prod
```

### Adding Environment Variables

```bash
# Add each variable
echo "your-value" | npx vercel env add VARIABLE_NAME production

# Or via the Vercel dashboard:
# vercel.com → Your Project → Settings → Environment Variables
```

### Subsequent Deploys

```bash
npx vercel --prod
```

That's it. Vercel:
1. Detects Next.js and runs `npm run build`
2. Deploys static files to its global CDN
3. Deploys API routes as serverless functions
4. Gives you a live URL in ~30 seconds

### How Vercel Serverless Functions Work

Each API route (`app/api/*/route.js`) becomes a separate serverless function:
- It **starts up** when a request arrives
- It **runs** and returns a response
- It **shuts down** (no persistent memory between requests)

This is why the MongoDB connection singleton is important — we cache the connection in `global` to reuse it within the same function instance.

### Free Tier Limits (Hobby Plan)

- 100 GB bandwidth/month
- Serverless function execution: 100 hours/month
- Build time: 6000 minutes/month

For a small marketplace, this is more than enough.

---

## 17. Building a Feature End to End

Let's walk through how we built the **Report Issue** feature from scratch as a concrete example.

### Step 1: Design the data model

What information do we need to store?

```js
{
  category: "Bug" | "Wrong Info" | "Suggestion" | "Other",
  description: "The app crashes when I...",
  role: "farmer",       // Who reported it
  phone: "9876543210",  // Their contact
  status: "open",       // Admin tracks resolution
  createdAt: Date,
}
```

### Step 2: Create the Mongoose model

```js
// models/Report.js
import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
  category:    { type: String, enum: ["Bug", "Wrong Info", "Suggestion", "Other"], default: "Bug" },
  description: { type: String, required: true },
  role:        { type: String, default: "" },
  phone:       { type: String, default: "" },
  status:      { type: String, enum: ["open", "resolved", "dismissed"], default: "open" },
}, { timestamps: true });

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
```

### Step 3: Build the API routes

```js
// app/api/reports/route.js — POST to submit, GET for admin
// app/api/reports/[id]/route.js — PATCH to update status
```

### Step 4: Build the UI screen

```jsx
// components/screens/ReportIssueScreen.jsx
export default function ReportIssueScreen({ role, phone, onBack, showToast }) {
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, description, role, phone }),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) return <ThankYouScreen onBack={onBack} />;

  return (/* form UI */);
}
```

### Step 5: Wire into the app shell

```jsx
// FarmMarket.jsx

// 1. Import
import ReportIssueScreen from "@/components/screens/ReportIssueScreen";

// 2. Add screen case
case "report-issue":
  return <ReportIssueScreen role={role} phone={farmer?.phone} onBack={() => nav(params.backTo)} />;

// 3. Add entry point (floating button)
{role && (
  <button onClick={() => nav("report-issue", { backTo: screen })}>
    📢 Report
  </button>
)}
```

### Step 6: Admin view

Add a Reports tab to AdminScreen that:
- Fetches from GET /api/reports
- Shows open reports with resolve/dismiss buttons
- Shows a badge count for open reports

### Step 7: Deploy

```bash
npx vercel --prod
```

**Total time for this feature: ~2 hours** (model + 2 API routes + 1 screen + admin tab + deploy).

---

## 18. Common Patterns Used Throughout the Code

### Pattern 1: Loading / Error / Success States

Every async operation has three states:

```jsx
const [loading, setLoading] = useState(false);
const [data, setData]       = useState([]);
const [error, setError]     = useState("");

const fetchData = async () => {
  setLoading(true);
  setError("");
  try {
    const res = await fetch("/api/something");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setData(json);
  } catch (err) {
    setError(err.message);
    showToast("Failed to load data", "error");
  } finally {
    setLoading(false);  // ← Always runs, even on error
  }
};
```

### Pattern 2: Optimistic UI Updates

Don't wait for the server — update the UI immediately:

```jsx
const handleToggleAvailability = async (item) => {
  // Update UI immediately (optimistic)
  setProduce(prev => prev.map(p =>
    p._id === item._id ? { ...p, available: !p.available } : p
  ));

  // Then sync with server
  const res = await fetch(`/api/produce/${item._id}`, {
    method: "PATCH",
    body: JSON.stringify({ available: !item.available }),
  });

  // Revert if it failed
  if (!res.ok) {
    setProduce(prev => prev.map(p =>
      p._id === item._id ? { ...p, available: item.available } : p
    ));
    showToast("Failed to update", "error");
  }
};
```

### Pattern 3: Inline Confirmation

For destructive actions (delete, cancel), show confirmation in the UI instead of a browser dialog:

```jsx
const [confirmDelete, setConfirmDelete] = useState(null);

{confirmDelete === item._id ? (
  <div style={{ background: "#FFF3F3", padding: 12, borderRadius: 8 }}>
    <p>Delete this item? This cannot be undone.</p>
    <button onClick={() => handleDelete(item._id)}>Yes, delete</button>
    <button onClick={() => setConfirmDelete(null)}>Cancel</button>
  </div>
) : (
  <button onClick={() => setConfirmDelete(item._id)}>🗑 Delete</button>
)}
```

### Pattern 4: Empty State

Always handle the case where there's no data:

```jsx
{items.length === 0 ? (
  <EmptyState
    icon="🌱"
    title="No produce listed yet"
    sub="Add your first harvest to reach buyers!"
    action={() => nav("add-produce")}
    actionLabel="Add Produce"
  />
) : (
  items.map(item => <ItemCard key={item._id} item={item} />)
)}
```

### Pattern 5: Toast Notifications

A global toast message system in FarmMarket.jsx:

```jsx
// FarmMarket.jsx
const [toast, setToast] = useState({ message: "", type: "success" });

const showToast = (message, type = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast({ message: "" }), 2500);  // Auto-dismiss
};

// Passed to every screen
<FarmerHome showToast={showToast} />

// Used in any screen
showToast("✓ Produce listed!");
showToast("Failed to save", "error");
```

### Pattern 6: Seed / Fallback Data

For demo mode and offline resilience:

```jsx
// Hardcoded seed data
const SEED_PRODUCE = [
  { _id: "p1", name: "Country Tomatoes", price: 28, /* ... */ },
];

// In FarmMarket.jsx
const [produce, setProduce] = useState(SEED_PRODUCE);  // ← Start with seed data

useEffect(() => {
  fetch("/api/produce")
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length) {
        setProduce(data);   // ← Replace with real data if available
      }
      // If API fails, we still have seed data showing
    })
    .catch(() => {});       // ← Silently ignore errors — seed data stays
}, []);
```

---

## Summary: Key Concepts to Master

| Concept | Where it's used | Why it matters |
|---|---|---|
| Next.js App Router | `app/` directory | Routing, API routes, layouts |
| React useState | Every component | Making UI interactive |
| React useEffect | Data fetching, timers | Running code on mount/change |
| Mongoose schemas | `models/*.js` | Structured database access |
| HMAC-SHA256 | `lib/auth.js` | Secure token signing |
| Serverless functions | `app/api/*/route.js` | Backend without a server |
| CSS custom properties | `globals.css` | Consistent design system |
| OTP authentication | `app/api/auth/` | Passwordless login |
| PWA manifest | `public/manifest.json` | Installable web app |
| Environment variables | `.env.local` | Keeping secrets safe |

---

*Built with Claude Code + Anthropic API*
*Upskill Global Technologies Pvt. Ltd., Bengaluru*
*Part of the 5serving · WorkFromFarms initiative*
