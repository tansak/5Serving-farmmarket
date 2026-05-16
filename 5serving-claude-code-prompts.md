# 5serving FarmMarket — Complete Claude Code Build Prompts
## Full PWA with Razorpay Payments | Upskill Global Technologies

> Run these prompts IN ORDER in a single Claude Code session.
> Each prompt builds on the previous one.
> Do not skip any prompt.

---

## PROMPT 0 — Orient Claude Code

```
Read the CLAUDE.md file in the project root thoroughly before doing anything.
Confirm you have understood:
1. The 5serving philosophy (5 pillars)
2. The tech stack (Next.js 15, no Tailwind, Nunito + Playfair Display fonts)
3. The colour palette (CSS variables — --gd, --terra, --gold, --cream etc.)
4. The API key rule (ANTHROPIC_API_KEY is server-side only, never NEXT_PUBLIC_)
5. The navigation pattern (single screen state in FarmMarket.jsx)

Reply with a short summary of what you understood before proceeding.
```

---

## PROMPT 1 — Scaffold the Project

```
Create a new Next.js 15 project called "5serving-farmmarket" with these exact options:
- App Router: yes
- TypeScript: no
- Tailwind: no
- ESLint: yes
- src/ directory: no
- Import alias: no

After creation, install these packages:
  npm install @anthropic-ai/sdk mongoose next-pwa razorpay

Create .env.local with these placeholders:
  ANTHROPIC_API_KEY=your_anthropic_key_here
  MONGODB_URI=your_mongodb_atlas_uri_here
  RAZORPAY_KEY_ID=your_razorpay_key_id_here
  RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
  NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here

Note: NEXT_PUBLIC_RAZORPAY_KEY_ID is safe to expose — it is the publishable key.
RAZORPAY_KEY_SECRET must NEVER be exposed client-side.

Create .gitignore with:
  node_modules
  .next
  .env.local
  *.pem
  /public/sw.js
  /public/workbox-*.js

Do not start the dev server. Confirm all packages installed successfully.
```

---

## PROMPT 2 — MongoDB Connection & Models

```
Create the database layer:

1. Create lib/mongoose.js — a singleton MongoDB connection helper:
   - Import mongoose
   - Use a module-level cached connection to avoid reconnecting on every request
   - Read URI from process.env.MONGODB_URI
   - Export a default connectDB() async function
   - Log "MongoDB connected" on first successful connection

2. Create models/Farmer.js with this Mongoose schema:
   {
     name:     { type: String, required: true },
     village:  { type: String, required: true },
     district: { type: String, default: "" },
     state:    { type: String, default: "Karnataka" },
     phone:    { type: String, default: "" },
     crops:    [String],
     joined:   { type: String, default: () => new Date().toISOString().slice(0,10) },
     active:   { type: Boolean, default: true }
   }
   Timestamps: true. Export as "Farmer" model.

3. Create models/Produce.js with this schema:
   {
     farmerId:    { type: String, required: true },
     farmerName:  { type: String, required: true },
     village:     String,
     name:        { type: String, required: true },
     category:    { type: String, required: true },
     quantity:    { type: Number, required: true },
     unit:        { type: String, required: true },
     price:       { type: Number, required: true },
     harvestDate: String,
     organic:     { type: Boolean, default: false },
     description: { type: String, default: "" },
     emoji:       { type: String, default: "🌱" },
     available:   { type: Boolean, default: true }
   }
   Timestamps: true. Export as "Produce" model.

4. Create models/Order.js with this schema:
   {
     orderNumber:    { type: String, required: true, unique: true },
     buyerName:      { type: String, required: true },
     buyerPhone:     { type: String, required: true },
     buyerAddress:   { type: String, required: true },
     community:      { type: String, default: "" },
     items: [{
       produceId:   String,
       produceName: String,
       farmerName:  String,
       emoji:       String,
       qty:         Number,
       unit:        String,
       price:       Number,
       subtotal:    Number
     }],
     totalAmount:    { type: Number, required: true },
     paymentMethod:  { type: String, enum: ["razorpay", "cod", "upi"], required: true },
     paymentStatus:  { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
     razorpayOrderId:   { type: String, default: "" },
     razorpayPaymentId: { type: String, default: "" },
     razorpaySignature: { type: String, default: "" },
     orderStatus:    { type: String, enum: ["placed", "confirmed", "dispatched", "delivered", "cancelled"], default: "placed" },
     notes:          { type: String, default: "" }
   }
   Timestamps: true. Export as "Order" model.

5. Create models/Community.js with this schema:
   {
     name:     { type: String, required: true },
     location: { type: String, required: true },
     members:  { type: Number, default: 0 },
     type:     { type: String, default: "General" },
     active:   { type: Boolean, default: true }
   }
   Timestamps: true. Export as "Community" model.

Confirm all 5 files created.
```

---

## PROMPT 3 — API Routes (Data)

```
Create all API route handlers. Each must:
- Import connectDB from lib/mongoose.js and call it first
- Have try/catch with proper error responses
- Return JSON only

CREATE THESE ROUTE FILES:

--- app/api/farmers/route.js ---
GET: return all farmers where active:true, sorted by createdAt desc
POST: create a new farmer from request body, return the created document

--- app/api/farmers/[id]/route.js ---
GET: return single farmer by MongoDB _id
PATCH: update farmer fields (name, village, district, state, phone, crops)
DELETE: set active:false (soft delete), return success message

--- app/api/produce/route.js ---
GET: return all produce where available:true, sorted by createdAt desc
    Support optional query param ?farmerId=xxx to filter by farmer
    Support optional query param ?category=xxx to filter by category
POST: create new produce listing from request body, return created document

--- app/api/produce/[id]/route.js ---
GET: return single produce item by MongoDB _id
PATCH: allow updating quantity, price, available, description fields
DELETE: set available:false (soft delete)

--- app/api/communities/route.js ---
GET: return all active communities
POST: create new community

--- app/api/orders/route.js ---
GET: return all orders sorted by createdAt desc
    Support optional query param ?status=xxx to filter
POST: create a new order. Generate orderNumber as "5SF" + Date.now()
      Return created order

--- app/api/orders/[id]/route.js ---
GET: return single order
PATCH: update orderStatus or paymentStatus

Confirm all route files created with correct export names (GET, POST, PATCH, DELETE).
```

---

## PROMPT 4 — Razorpay Payment API Routes

```
Create the Razorpay payment integration on the server side.

1. Create app/api/payment/create-order/route.js
   This is a POST handler that:
   - Reads { amount, currency, receipt, notes } from request body
   - amount is in PAISE (multiply rupees × 100 before sending here)
   - Imports Razorpay from "razorpay"
   - Initialises: new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
   - Creates a Razorpay order using razorpay.orders.create({ amount, currency: "INR", receipt })
   - Returns { orderId: order.id, amount: order.amount, currency: order.currency }
   - On error: return 500 with { error: "Payment order creation failed" }

2. Create app/api/payment/verify/route.js
   This is a POST handler that:
   - Reads { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } from body
   - orderId here is our MongoDB Order _id
   - Uses crypto (Node built-in) to verify the Razorpay signature:
       const body = razorpay_order_id + "|" + razorpay_payment_id
       const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                                        .update(body).digest("hex")
       const isValid = expectedSignature === razorpay_signature
   - If valid:
       - Update the Order in MongoDB: paymentStatus="paid", razorpayOrderId, razorpayPaymentId, razorpaySignature, orderStatus="confirmed"
       - Return { success: true, message: "Payment verified" }
   - If invalid:
       - Update Order: paymentStatus="failed"
       - Return 400 { success: false, message: "Payment verification failed" }

3. Create app/api/payment/cod/route.js
   This is a POST handler for Cash on Delivery:
   - Reads { orderId } from body (MongoDB Order _id)
   - Updates Order: paymentMethod="cod", paymentStatus="pending", orderStatus="confirmed"
   - Returns { success: true, message: "COD order confirmed" }

Confirm all three payment route files are created.
```

---

## PROMPT 5 — AI Route

```
Create app/api/ai/route.js as a POST handler:

- Read { prompt, system } from request body
- Import Anthropic from "@anthropic-ai/sdk"
- Initialise: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
- Call anthropic.messages.create with:
    model: "claude-sonnet-4-20250514"
    max_tokens: 1000
    system: system || "You are a warm, helpful assistant for 5serving FarmMarket — an Indian farmers marketplace. Keep responses concise and practical."
    messages: [{ role: "user", content: prompt }]
- Return { text: response.content[0].text }
- On error: return 500 with { text: "AI response unavailable right now." }

This route must use Node.js runtime — add this at the top:
  export const runtime = "nodejs"

Confirm file created.
```

---

## PROMPT 6 — Global Design System

```
Create app/globals.css with this EXACT content — do not modify the values:

:root {
  --gd: #1B4332;
  --gm: #2D6A4F;
  --gl: #52B788;
  --gs: #D8F3DC;
  --terra: #C84B2F;
  --terra-l: #F0846A;
  --terra-s: #FDE8E4;
  --gold: #E9A100;
  --gold-l: #FFC93C;
  --gold-s: #FFF4D6;
  --cream: #FDFAF3;
  --parch: #F5EDDA;
  --brown: #4A2810;
  --brown-l: #9C6A3A;
  --ink: #1C1008;
  --muted: #7A6652;
  --border: #E0D4C0;
  --shadow: 0 4px 20px rgba(74,40,16,.10);
  --shadow-lg: 0 12px 40px rgba(74,40,16,.16);
  --r: 16px;
  --r-sm: 10px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Nunito', sans-serif;
  background: var(--cream);
  color: var(--ink);
  min-height: 100vh;
}

h1, h2, h3, h4, h5 { font-family: 'Playfair Display', serif; }

button { cursor: pointer; border: none; outline: none; font-family: 'Nunito', sans-serif; }
input, select, textarea { outline: none; font-family: 'Nunito', sans-serif; }
a { text-decoration: none; color: inherit; }

Then update app/layout.js:
- Add Google Fonts link in <head>:
    https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Nunito:wght@400;500;600;700&display=swap
- Add <meta name="theme-color" content="#1B4332" />
- Add <link rel="manifest" href="/manifest.json" />
- Add <meta name="apple-mobile-web-app-capable" content="yes" />
- Set <html lang="en">
- Set <body> background: var(--cream)
- Import globals.css
- Title: "5serving FarmMarket"
- Description: "Farm Fresh. Community First. Direct from farmers to your table."

Confirm both files updated.
```

---

## PROMPT 7 — Component Library (Reusable UI)

```
Create components/ui.jsx with "use client" at top.

Export these reusable components:

1. NavBar({ title, sub, onBack, right })
   - Fixed top bar, background var(--gd), white text
   - Back button (←) on left if onBack provided
   - Title in Playfair Display, sub in small muted text
   - right slot for icons/buttons

2. BottomTabBar({ tabs, activeTab, onTab })
   - Fixed bottom bar, white background, border-top
   - tabs = [{ id, icon (emoji), label, badge? }]
   - Active tab highlighted in var(--gd)
   - Badge shown as red circle with number if badge > 0

3. Btn({ variant, size, block, onClick, disabled, loading, children })
   - variants: "primary" (green), "terra" (terracotta), "gold", "outline", "ai" (gradient green), "ghost"
   - sizes: "sm", "md" (default), "lg"
   - loading: shows a spinner and disables button
   - block: full width

4. Card({ children, padding, onClick, hover })
   - White background, var(--r) radius, var(--shadow)
   - hover: lifts on hover if true

5. Badge({ variant, children })
   - variants: "green", "terra", "gold", "brown"
   - Pill-shaped label

6. FormGroup({ label, children, hint })
   - Label in uppercase, 11px, var(--muted)
   - Wraps any input/select/textarea
   - Optional hint text below

7. Input({ type, placeholder, value, onChange, ...rest })
   - Styled input matching design system

8. Select({ value, onChange, children, ...rest })
   - Styled select matching design system

9. Textarea({ value, onChange, placeholder, rows })
   - Styled textarea matching design system

10. Toast({ message, type })
    - Fixed bottom toast, green for success, terra for error
    - Fades in/out

11. EmptyState({ icon, title, sub, action, actionLabel })
    - Centered empty state with emoji icon

12. Spinner()
    - Small inline spinner for loading states

13. Divider()
    - Horizontal rule matching design system

14. AIPanel({ title, body })
    - Green gradient surface panel for AI-generated content

Confirm all components exported from components/ui.jsx.
```

---

## PROMPT 8 — Seed Data Script

```
Create scripts/seed.js — a Node.js script (not Next.js) that seeds the database.

It should:
1. Connect to MongoDB using process.env.MONGODB_URI (use dotenv to load .env.local)
2. Clear existing Farmer, Produce, Community collections
3. Insert these 4 farmers:
   - Ramu Gowda | Channarayapatna, Hassan, Karnataka | crops: Vegetables, Grains | phone: 9876543210
   - Savita Devi | Wai, Satara, Maharashtra | crops: Fruits, Pulses | phone: 9823456701
   - Krishnamurthy R | Ponneri, Tiruvallur, Tamil Nadu | crops: Herbs, Spices | phone: 9765432108
   - Meena Patil | Hubli, Dharwad, Karnataka | crops: Dairy, Vegetables | phone: 9741236580

4. Insert these 8 produce items (use actual MongoDB farmer _ids after insert):
   - Country Tomatoes | Ramu Gowda | Vegetables | 50kg | ₹28/kg | organic | 🍅
   - Alphonso Mangoes | Savita Devi | Fruits | 100kg | ₹180/kg | organic | 🥭
   - Red Rice | Ramu Gowda | Grains | 200kg | ₹65/kg | conventional | 🌾
   - Fresh Curry Leaves | Krishnamurthy R | Herbs | 20kg | ₹40/kg | organic | 🌿
   - Chana Dal | Savita Devi | Pulses | 80kg | ₹90/kg | conventional | 🫘
   - Red Chilli Powder | Krishnamurthy R | Spices | 30kg | ₹160/kg | organic | 🌶️
   - Fresh Cow Milk | Meena Patil | Dairy | 50 litre | ₹52/litre | organic | 🥛
   - Drumstick (Moringa) | Ramu Gowda | Vegetables | 30 bundle | ₹25/bundle | organic | 🌿

5. Insert these 3 communities:
   - Bengaluru Urban Farmers Hub | Bengaluru, Karnataka | 240 members | Urban Community
   - Pune Organic Collective | Pune, Maharashtra | 180 members | Organic Buyers
   - Chennai HomeCooks Circle | Chennai, Tamil Nadu | 320 members | Home Cooks

6. Log counts after insert and disconnect.

Install dotenv: npm install --save-dev dotenv
Add to package.json scripts: "seed": "node scripts/seed.js"

Confirm script created. Do NOT run it yet.
```

---

## PROMPT 9 — Landing & Role Selection Screen

```
Create components/screens/LandingScreen.jsx with "use client".

This is the first screen users see. Build it with:

HERO SECTION:
- Full-width, background: linear-gradient(160deg, #1B4332, #2D6A4F, #52B788)
- Noise texture overlay using SVG pattern (subtle dots)
- Brand pill: "🌿 5serving · FarmMarket"
- Sub: "AI-First Farmers Marketplace"
- Headline (Playfair Display 900): "Farm Fresh.\nCommunity First."
- Body: "Connecting India's farmers with urban communities — fresh produce, zero middlemen, fair prices."
- Stats row (3 pills with frosted glass):
  - "🌾 Farmers Online" with live count from /api/farmers
  - "🥦 Produce Listed" with live count from /api/produce
  - "🏘️ Communities" with live count from /api/communities

ROLE SELECTION (below hero):
- Section title: "Who are you today?"
- 4 role cards in 2×2 grid:
  1. 👨‍🌾 I'm a Farmer — "List & manage my produce"
  2. 🛒 I'm a Buyer — "Browse & order fresh produce"
  3. ⚙️ Admin — "Manage platform data"
  4. 🏘️ Community — "Group orders for your colony"
- Each card: white, rounded, shadow, hover lifts with green border

FOOTER:
- Dark green (#1B4332) strip
- "The 5serving Promise"
- Small text: "Farmers · Families · Community · Planet · Health"

Props: { onRole(role) }
When a role card is clicked, call onRole with: "farmer", "consumer", "admin", or "community"

Fetch the counts on mount using fetch("/api/farmers") etc.
Show "…" while loading.

Export default LandingScreen.
```

---

## PROMPT 10 — Farmer Portal Screens

```
Create components/screens/farmer/ directory with these files:

--- FarmerHome.jsx ---
Props: { farmers, produce, onNav }

Show:
- NavBar: "Farmer Portal" / "5serving FarmMarket"
- Farmer selector dropdown (select from farmers list)
- Selected farmer info card: name, village, district, listings count, organic badge if any crops
- "My Produce" section heading with "+ Add Produce" button
- Grid of produce cards (2 columns):
  Each card shows: emoji, name, qty + unit, price, organic badge
  Click opens product detail (call onNav("farmer-produce-detail", { produce: item }))
- Empty state if no produce: "🌱 No produce listed yet" + "Add First Produce" button
- Divider + "Register New Farmer" outline button at bottom

--- AddProduceScreen.jsx ---
Props: { farmers, initialFarmerId, onSave, onBack }

Form fields:
- Farmer selector (if multiple farmers)
- Produce name (required)
- Category (dropdown: Vegetables, Fruits, Grains, Pulses, Dairy, Herbs, Spices, Roots)
- Unit (dropdown: kg, g, litre, dozen, bundle, bag, piece)
- Quantity (number, required)
- Price per unit in ₹ (number, required)
- Harvest date (date picker)
- Organic checkbox: "🌿 This produce is organically grown"
- Description (textarea)

AI Describe button:
- Calls POST /api/ai with prompt built from form values
- Shows spinner while loading
- Fills description field with result

Live Preview card (shows as form is filled):
- Emoji (mapped from category), name, price, organic badge

On save:
- POST to /api/produce with form data
- On success: call onSave() and show toast "✓ Produce listed!"
- Validate: name, quantity, price are required

--- AddFarmerScreen.jsx ---
Props: { onSave, onBack }

Form: name, village, district, state (default Karnataka), phone, crops (multi-select chips)
POST to /api/farmers on save
Call onSave(farmer) on success

--- FarmerProduceDetail.jsx ---
Props: { produce, onBack, onEdit }
Show all produce details with edit button
Allow toggling availability (PATCH /api/produce/:id)

All files must have "use client" at top.
Confirm all 4 files created.
```

---

## PROMPT 11 — Consumer Portal Screens

```
Create components/screens/consumer/ directory with these files:

--- ConsumerHome.jsx ---
Props: { produce, cart, onSelectProduce, onNav }

- Hero strip (shorter than landing): green gradient, "Today's Harvest 🌾", subtitle
- Search bar (round pill, 🔍 icon)
- Category filter chips: All / Vegetables / Fruits / Grains / Pulses / Dairy / Herbs / Spices / Roots
- Organic-only toggle checkbox
- Results count: "X items available"
- Produce grid (2 columns):
  Each card: emoji background (green for organic, parchment for conventional),
  produce name, farmer name, category badge, organic badge, price/unit
  Click → onSelectProduce(produce)
- Empty state if no results

Fetch produce from /api/produce on mount.
Filter client-side for search, category, and organic toggle.

--- ProductDetail.jsx ---
Props: { product, cart, onBack, onAddToCart }

- NavBar with back button
- Large emoji display (parchment background)
- Freshness badge: based on harvestDate
  0 days = "🟢 Harvested today"
  1 day  = "🟢 Yesterday"
  2-3d   = "🟡 N days ago"
  4d+    = "🔴 N days ago"
- Produce name (Playfair Display, large)
- Farmer name + village
- Description paragraph
- Divider
- Price display (Playfair Display, terracotta)
- Quantity stepper (−  N  +)
- Total calculation: price × qty shown in green
- Available stock shown
- "🛒 Add to Cart" button (primary green, full width)
- Divider
- AI Nutrition Insight section:
  - "✨ AI Nutrition Insight" heading
  - "Get Tips" button calls POST /api/ai
  - Shows result in AIPanel component
  - Shows placeholder text before tapped

--- CartScreen.jsx ---
Props: { cart, onBack, onRemoveItem, onUpdateQty, onCheckout }

- NavBar: "Your Cart" / "N items"
- If empty: EmptyState with 🛒 icon
- List of cart items:
  Each: emoji, name, farmer, qty × unit, subtotal
  Swipe or button to remove
  Qty stepper inline
- Order summary box:
  Subtotal / Platform fee: ₹0 (Free!) / Total
- "5serving Impact" AIPanel:
  "100% of your payment goes directly to farmers."
- "Proceed to Checkout →" button (primary, full width)

--- CheckoutScreen.jsx ---
Props: { cart, onBack, onOrderPlaced }

STEP 1 — Buyer Details:
- Form: Full Name (required), Phone (required), Delivery Address (required)
- Community selector dropdown (fetched from /api/communities)
- Order notes (optional textarea)

STEP 2 — Payment Method:
Show 3 options as selectable cards:

Card 1 — Razorpay (Online Payment)
  - Icon: 💳
  - Label: "Pay Online — UPI / Card / NetBanking"
  - Sub: "Instant confirmation. Powered by Razorpay."
  - Badge: "Recommended"

Card 2 — UPI QR (Static)
  - Icon: 📱
  - Label: "Pay via UPI"
  - Sub: "Scan QR or pay to: 5serving@upi"
  - Note: "Share screenshot after payment"

Card 3 — Cash on Delivery
  - Icon: 💵
  - Label: "Cash on Delivery"
  - Sub: "Pay when your produce arrives"
  - Note: "Available within 30km of farm"

STEP 3 — Place Order button:
- Validate all required fields first
- POST to /api/orders to create order record
- Then:
  IF Razorpay selected:
    - POST to /api/payment/create-order with { amount: totalInPaise, receipt: orderNumber }
    - Load Razorpay checkout script dynamically: https://checkout.razorpay.com/v1/checkout.js
    - Open Razorpay modal with:
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        amount: totalInPaise
        currency: "INR"
        name: "5serving FarmMarket"
        description: "Farm fresh produce order"
        order_id: razorpayOrderId from API
        prefill: { name: buyerName, contact: buyerPhone }
        theme: { color: "#1B4332" }
    - On payment success handler:
        POST to /api/payment/verify with signature data + our orderId
        On verify success: call onOrderPlaced(order)
    - On payment failure: show error toast
  
  IF COD selected:
    - POST to /api/payment/cod with { orderId }
    - Call onOrderPlaced(order)
  
  IF UPI selected:
    - Update order paymentMethod="upi", paymentStatus="pending"
    - Call onOrderPlaced(order) (manual verification later)

Export all files. All must have "use client" at top.
Confirm all 5 files created.
```

---

## PROMPT 12 — Order Success Screen

```
Create components/screens/OrderSuccessScreen.jsx with "use client".

Props: { order, paymentMethod, onContinue }

Layout:
- Full screen, centered, cream background
- Large success animation: 
  Green circle that scales in, then checkmark draws inside it (CSS animation)
- "Order Confirmed! 🎉" (Playfair Display, forest green, large)
- Order number: "Order #5SF..." in terracotta
- Payment status badge:
  - Razorpay: "💳 Payment Successful" (green badge)
  - COD: "💵 Cash on Delivery" (gold badge)
  - UPI: "📱 UPI — Awaiting Confirmation" (amber badge)

Order summary box:
- List all items with emoji, name, qty, subtotal
- Total amount

"What happens next" section:
- 📞 "Farmer will call to confirm within 2 hours"
- 🚚 "Delivery within 24-48 hours"
- 💯 "100% of your payment reaches the farmer"

"The 5serving Promise fulfilled" panel (AIPanel style):
- 🌾 Farmer — fair income, direct payment
- 🏠 Family — fresh produce at your door
- 🏘️ Community — local economy boosted
- 🌍 Planet — fewer food miles
- 💚 Health — seasonal, chemical-free

"Continue Shopping" button → onContinue()
"Track My Order" button (outline) → shows order status timeline (placed → confirmed → dispatched → delivered)

Export default OrderSuccessScreen.
```

---

## PROMPT 13 — Admin Screen

```
Create components/screens/admin/AdminScreen.jsx with "use client".

Props: { onNav, onAddFarmer }

NavBar: "Admin Panel" / "5serving FarmMarket"

Tab navigation inside screen (not bottom bar):
Tabs: Overview | Farmers | Produce | Orders | Communities

--- Overview Tab ---
Stats grid (2×2):
- Total Farmers (fetch /api/farmers)
- Total Produce (fetch /api/produce)
- Total Orders (fetch /api/orders)
- Total Communities (fetch /api/communities)

Recent Orders list (last 5):
Each: order number, buyer name, amount, payment status badge, order status badge

--- Farmers Tab ---
List of all farmers:
Each card: 👨‍🌾 avatar, name, village+district, crops badges, listings count
"+ Register Farmer" button at top → onAddFarmer()

--- Produce Tab ---
List of all produce:
Each: emoji, name, farmer, qty, price, organic badge, available toggle switch
Toggle calls PATCH /api/produce/:id { available: !current }

--- Orders Tab ---
Full orders table:
Columns: Order#, Buyer, Items, Amount, Payment, Status, Date
Payment status: colour-coded badges (green=paid, amber=pending, red=failed)
Order status: timeline badges (placed, confirmed, dispatched, delivered, cancelled)
Click order → expand to show full details

--- Communities Tab ---
Community cards: name, location, members count, type badge
"+ Add Community" button → inline form

All data fetched on mount from API routes.
Show loading spinners while fetching.
Show error state if fetch fails.

Export default AdminScreen.
```

---

## PROMPT 14 — Main App Orchestrator

```
Create components/FarmMarket.jsx with "use client".

This is the ROOT component that manages all navigation and shared state.

IMPORTS:
Import all screen components created in Prompts 9–13.
Import { NavBar, BottomTabBar, Toast } from components/ui.jsx

STATE:
- screen: string — current screen key (starts as "landing")
- params: object — data passed to current screen
- role: string — "farmer" | "consumer" | "admin" | "community" | ""
- cart: array — cart items
- toast: { message, type } — current toast
- farmers: array — loaded from /api/farmers
- produce: array — loaded from /api/produce
- communities: array — loaded from /api/communities

NAVIGATION:
nav(screenKey, paramsObject) — sets screen + params

CART FUNCTIONS:
- addToCart(item): add or update item in cart array
- removeFromCart(produceId): remove item from cart
- updateCartQty(produceId, qty): update qty, remove if qty === 0
- clearCart(): empty the cart
- cartCount: derived number (total qty of all items)
- cartTotal: derived number (sum of price × qty)

DATA LOADING:
On mount, fetch /api/farmers, /api/produce, /api/communities
Store in state for use across screens

TOAST HELPER:
showToast(message, type="success") — shows toast for 2.5 seconds

ROLE HANDLER:
handleRole(role) — sets role, navigates to correct home screen:
  "farmer"    → "farmer-home"
  "consumer"  → "consumer-home"
  "admin"     → "admin"
  "community" → "consumer-home" (community buyers use consumer portal)

BOTTOM TAB BAR:
Farmer tabs:    🌾 My Farm | ➕ Add Produce | 🔄 Switch Role
Consumer tabs:  🏪 Market | 🛒 Cart (with badge=cartCount) | 🔄 Switch Role
Admin tabs:     ⚙️ Admin | 🔄 Switch Role

SCREEN RENDERER (renderScreen function):
Map screen key to component, pass correct props.
All navigation calls go through nav().
All cart operations passed as props to screens that need them.

KEY SCREEN MAPPINGS:
"landing"             → LandingScreen
"farmer-home"         → FarmerHome
"add-produce"         → AddProduceScreen
"add-farmer"          → AddFarmerScreen
"farmer-produce-detail" → FarmerProduceDetail
"consumer-home"       → ConsumerHome
"product-detail"      → ProductDetail
"cart"                → CartScreen
"checkout"            → CheckoutScreen
"order-success"       → OrderSuccessScreen
"admin"               → AdminScreen

WRAPPER:
Return:
<div className="app-shell" style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: "var(--cream)", position: "relative" }}>
  {renderScreen()}
  {role && <BottomTabBar ... />}
  <Toast ... />
</div>

Export default FarmMarket.
```

---

## PROMPT 15 — Page Entry Point

```
Update app/page.js:

"use client"

Import FarmMarket from components/FarmMarket.jsx
Render it directly as the full page — no wrapper div needed.
The component handles its own layout.

File should be exactly:
---
"use client";
import FarmMarket from "@/components/FarmMarket";
export default function Page() {
  return <FarmMarket />;
}
---

Then update app/layout.js to ensure:
- No default Next.js padding or margin on body
- background: var(--cream) on body
- font-family: 'Nunito', sans-serif on body

Confirm both files updated.
```

---

## PROMPT 16 — PWA Configuration

```
1. Create public/manifest.json:
{
  "name": "5serving FarmMarket",
  "short_name": "FarmMarket",
  "description": "Farm Fresh. Community First. Direct from farmers to your table.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDFAF3",
  "theme_color": "#1B4332",
  "orientation": "portrait",
  "categories": ["food", "shopping", "lifestyle"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "shortcuts": [
    { "name": "Browse Produce", "url": "/", "description": "Shop farm fresh produce" },
    { "name": "My Farm", "url": "/?role=farmer", "description": "Manage your farm listings" }
  ]
}

2. Create public/icon.svg:
A 512×512 SVG — circle background in #1B4332, white leaf/sprout icon centred inside.
The sprout should look clean and minimal.

3. Generate PNG icons from the SVG:
Use sharp or canvas — install: npm install --save-dev sharp
Create scripts/generate-icons.js that reads public/icon.svg and writes:
- public/icon-192.png (192×192)
- public/icon-512.png (512×512)
Run it: node scripts/generate-icons.js

4. Update next.config.js to wrap with next-pwa:
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com/,
      handler: "CacheFirst",
      options: { cacheName: "google-fonts", expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } }
    },
    {
      urlPattern: /\/api\/produce/,
      handler: "NetworkFirst",
      options: { cacheName: "produce-api", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 } }
    },
    {
      urlPattern: /\/api\/farmers/,
      handler: "NetworkFirst",
      options: { cacheName: "farmers-api", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 } }
    }
  ]
})
module.exports = withPWA({ reactStrictMode: true })

5. Create public/robots.txt:
User-agent: *
Allow: /

Confirm all 5 steps complete.
```

---

## PROMPT 17 — Build & Fix

```
Now do a complete build check:

Step 1: Run the seed script to populate the database:
  npm run seed
  (Ensure MONGODB_URI is set in .env.local first)

Step 2: Run the development server and check for runtime errors:
  npm run dev
  Open http://localhost:3000 and report any console errors.

Step 3: Check these specific things manually:
  a. Landing screen loads with live counts from API
  b. Farmer portal: can add produce with AI description
  c. Consumer portal: can browse, filter, and add to cart
  d. Checkout: all 3 payment options shown as selectable cards
  e. Razorpay modal opens (use test keys — key_id starting with rzp_test_)
  f. COD flow completes and shows order success screen
  g. Admin panel: all 4 tabs show data from MongoDB

Step 4: Run production build:
  npm run build
  Fix EVERY error and warning. Do not ignore TypeScript-style prop errors.
  Common issues to fix:
  - "use client" missing from any component using hooks
  - API routes accidentally importing client-only code
  - Missing key props in lists
  - Unhandled promise rejections in useEffect

Step 5: Run build again until it passes with 0 errors.

Report the final build output.
```

---

## PROMPT 18 — Razorpay Test Mode Verification

```
Verify the complete Razorpay payment flow using test credentials:

1. Confirm RAZORPAY_KEY_ID starts with "rzp_test_" in .env.local
   (Get test keys from: https://dashboard.razorpay.com → Settings → API Keys)

2. Walk through the full purchase flow:
   - Add "Country Tomatoes" 2kg to cart (₹56 total)
   - Go to checkout
   - Fill: Name "Test Buyer", Phone "9999999999", Address "123 Test St, Bengaluru"
   - Select "Pay Online — Razorpay"
   - Click "Place Order"
   - Confirm:
     a. POST /api/orders creates order in MongoDB
     b. POST /api/payment/create-order returns a Razorpay order ID
     c. Razorpay modal opens with amount ₹56 and green theme
     d. Use test card: 4111 1111 1111 1111, CVV 123, Expiry 12/25, OTP 123456
     e. On success, POST /api/payment/verify is called
     f. Order in MongoDB updated: paymentStatus="paid", orderStatus="confirmed"
     g. OrderSuccessScreen shows with "💳 Payment Successful" badge

3. Test COD flow:
   - Add item to cart, checkout, select COD, place order
   - Confirm order created with paymentMethod="cod", orderStatus="confirmed"

4. Check Admin panel Orders tab shows both test orders with correct status badges.

Report the results of each step.
```

---

## PROMPT 19 — Deploy to Vercel

```
Deploy the application to Vercel:

Step 1 — Git setup:
  git init (if not done)
  git add .
  git commit -m "feat: 5serving FarmMarket PWA with Razorpay payments"

Step 2 — Deploy:
  npx vercel --prod

  When prompted:
  - Set up and deploy: Y
  - Which scope: (your account)
  - Link to existing project: N
  - Project name: 5serving-farmmarket
  - Directory: ./
  - Override settings: N

Step 3 — Set environment variables on Vercel:
  Run each of these and paste the actual values:
  npx vercel env add ANTHROPIC_API_KEY production
  npx vercel env add MONGODB_URI production
  npx vercel env add RAZORPAY_KEY_ID production
  npx vercel env add RAZORPAY_KEY_SECRET production
  npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production

Step 4 — Redeploy with env vars:
  npx vercel --prod

Step 5 — Verify production:
  Run these curl tests against YOUR_VERCEL_URL:
  
  curl https://YOUR_URL/api/farmers
  → Should return array of farmers from MongoDB
  
  curl https://YOUR_URL/api/produce
  → Should return array of produce items
  
  curl -X POST https://YOUR_URL/api/ai \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Describe fresh tomatoes in 1 sentence for an Indian market"}'
  → Should return { text: "..." }

Step 6 — Test PWA install:
  Open the Vercel URL on mobile Chrome
  Should see "Add to Home Screen" prompt
  Install and confirm it opens in standalone mode (no browser chrome)

Report the live Vercel URL.
```

---

## PROMPT 20 — README & Final Handoff

```
Create README.md with these sections:

# 5serving FarmMarket PWA

## What is this?
Brief description — AI-first farmers marketplace, part of 5serving initiative

## The 5 Pillars
List all 5 serving pillars with one-line descriptions

## Features
- Farmer Portal: list produce with AI-generated descriptions
- Consumer Portal: browse, filter, search, and buy
- 3 Payment options: Razorpay (UPI/Card/NetBanking), UPI QR, Cash on Delivery
- AI Nutrition Insights powered by Claude
- Admin Panel: manage farmers, produce, orders, communities
- Full PWA: installable, offline-capable

## Tech Stack
Next.js 15 / MongoDB Atlas / Anthropic Claude / Razorpay / next-pwa

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Anthropic API key (https://console.anthropic.com)
- Razorpay account (https://razorpay.com) — use test keys for development

### Environment Variables
List all 5 env vars with descriptions (not actual values)

### Local Development
npm install
npm run seed
npm run dev

### Production Deploy
npx vercel --prod
(Set all env vars via Vercel dashboard or CLI)

## Razorpay Test Cards
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 123456 (for test mode)

## Project Structure
Show the full folder tree

## Built By
Upskill Global Technologies Pvt. Ltd., Bengaluru
Part of the 5serving · WorkFromFarms initiative

---

After README, do a final git commit:
  git add .
  git commit -m "docs: add README and finalise project"
  npx vercel --prod

Confirm the final live URL is working.
```

---

## Quick Reference — Prompt Run Order

| # | What it does | Time estimate |
|---|---|---|
| 0 | Orient Claude Code | 1 min |
| 1 | Scaffold + install packages | 3 min |
| 2 | MongoDB models | 5 min |
| 3 | Data API routes | 8 min |
| 4 | Razorpay payment routes | 5 min |
| 5 | AI route | 3 min |
| 6 | Global CSS + layout | 3 min |
| 7 | Reusable component library | 10 min |
| 8 | Seed script | 5 min |
| 9 | Landing screen | 8 min |
| 10 | Farmer portal screens | 10 min |
| 11 | Consumer portal screens | 15 min |
| 12 | Order success screen | 5 min |
| 13 | Admin screen | 10 min |
| 14 | Main orchestrator | 10 min |
| 15 | Page entry point | 2 min |
| 16 | PWA config | 5 min |
| 17 | Build & fix | 10 min |
| 18 | Razorpay test verification | 10 min |
| 19 | Vercel deploy | 8 min |
| 20 | README + handoff | 5 min |

**Total: ~2.5 hours for a complete production PWA**

---

## Razorpay Account Setup (Before Starting)

1. Sign up at https://razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Copy Key ID (starts with `rzp_test_`) and Key Secret
4. Paste both into .env.local before running Prompt 1
5. For production: generate Live keys and swap them in Vercel env vars

## MongoDB Atlas Setup (Before Starting)

1. Go to https://cloud.mongodb.com
2. Create free cluster (M0 tier — free forever)
3. Add database user with password
4. Whitelist IP: 0.0.0.0/0 (allow all — for Vercel serverless)
5. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/5serving-farmmarket
6. Paste into MONGODB_URI in .env.local

---

*Built with Claude Code | Upskill Global Technologies Pvt. Ltd.*
*5serving · WorkFromFarms Initiative | Bengaluru, India*
