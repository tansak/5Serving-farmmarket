# 5serving FarmMarket PWA

> Farm Fresh. Community First. Direct from farmers to your table.

## What is this?

5serving FarmMarket is an AI-first progressive web app that connects Karnataka farmers directly with urban communities — fresh produce, zero middlemen, fair prices. Built as part of the **5serving · WorkFromFarms** initiative by Upskill Global Technologies Pvt. Ltd., Bengaluru.

---

## The 5 Pillars

| Pillar | What it means |
|---|---|
| 🌾 **Farmers** | Fair income, no exploitation, simple UX even for low-literacy users |
| 🏠 **Families** | Affordable, fresh, nutritious produce at doorstep |
| 🏘️ **Community** | Group/colony orders, local economy strengthening |
| 🌍 **Planet** | Less food miles, organic-first, zero waste framing |
| 💚 **Health** | AI nutrition insights, seasonal produce, chemical-free emphasis |

---

## Features

- **Farmer Portal** — List produce with AI-generated descriptions (Claude), toggle availability, register new farmers
- **Consumer Portal** — Browse, search, filter by category/organic, add to cart
- **3 Payment Options** — Razorpay (UPI/Card/NetBanking), UPI QR, Cash on Delivery
- **AI Nutrition Insights** — Powered by Anthropic Claude (claude-sonnet-4-20250514)
- **Admin Panel** — Manage farmers, produce, orders, and communities across 5 tabs
- **Full PWA** — Installable, offline-capable, service worker via next-pwa
- **Order Tracking** — Full order lifecycle: placed → confirmed → dispatched → delivered

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, plain CSS |
| Fonts | Playfair Display + Nunito via Google Fonts |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) via `@anthropic-ai/sdk` |
| Database | MongoDB Atlas via Mongoose |
| Payments | Razorpay |
| PWA | `@ducanh2912/next-pwa` |
| Deployment | Vercel |

---

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier works)
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com)
- Razorpay account — [razorpay.com](https://razorpay.com) — use **test keys** for development

### Environment Variables

Create `.env.local` in the project root:

```bash
# Anthropic AI (server-side only — never expose client-side)
ANTHROPIC_API_KEY=sk-ant-...

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/5serving-farmmarket

# Razorpay (server-side secret)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_key_secret_here

# Razorpay publishable key (safe for client-side)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

> **Security note:** `ANTHROPIC_API_KEY` and `RAZORPAY_KEY_SECRET` are server-side only. Never prefix them with `NEXT_PUBLIC_`.

### Local Development

```bash
npm install
npm run seed        # Seed MongoDB with sample farmers, produce, and communities
npm run dev         # Start on http://localhost:3000
```

### Production Build

```bash
npm run build       # Must pass with 0 errors before deploy
npm run start       # Preview production build locally
```

### Production Deploy

```bash
npx vercel --prod

# Set environment variables on Vercel:
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add MONGODB_URI production
npx vercel env add RAZORPAY_KEY_ID production
npx vercel env add RAZORPAY_KEY_SECRET production
npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID production

npx vercel --prod   # Redeploy with env vars
```

---

## Razorpay Test Cards

Use these in Razorpay test mode:

| Field | Value |
|---|---|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future date |
| CVV | Any 3 digits |
| OTP | 123456 |

---

## Project Structure

```
5serving-farmmarket/
├── app/
│   ├── layout.tsx              # Root layout — fonts, meta, manifest
│   ├── page.tsx                # Entry point — renders <FarmMarket />
│   ├── globals.css             # Design system CSS variables
│   └── api/
│       ├── ai/route.js         # POST — Anthropic AI proxy
│       ├── farmers/            # GET list, POST create, [id] PATCH/DELETE
│       ├── produce/            # GET list, POST create, [id] PATCH/DELETE
│       ├── communities/        # GET list, POST create
│       ├── orders/             # GET list, POST create, [id] PATCH
│       └── payment/
│           ├── create-order/   # POST — create Razorpay order
│           ├── verify/         # POST — verify payment signature
│           └── cod/            # POST — confirm COD order
├── components/
│   ├── FarmMarket.jsx          # Root component — all state & navigation
│   ├── ui.jsx                  # Reusable design system components
│   └── screens/
│       ├── LandingScreen.jsx
│       ├── OrderSuccessScreen.jsx
│       ├── farmer/
│       │   ├── FarmerHome.jsx
│       │   ├── AddProduceScreen.jsx
│       │   ├── AddFarmerScreen.jsx
│       │   └── FarmerProduceDetail.jsx
│       ├── consumer/
│       │   ├── ConsumerHome.jsx
│       │   ├── ProductDetail.jsx
│       │   ├── CartScreen.jsx
│       │   └── CheckoutScreen.jsx
│       └── admin/
│           └── AdminScreen.jsx
├── models/
│   ├── Farmer.js
│   ├── Produce.js
│   ├── Order.js
│   └── Community.js
├── lib/
│   └── mongoose.js             # MongoDB singleton connection
├── scripts/
│   ├── seed.js                 # Database seeder
│   └── generate-icons.js      # PWA icon generator
└── public/
    ├── manifest.json
    ├── icon-192.png
    ├── icon-512.png
    └── robots.txt
```

---

## Built By

**Upskill Global Technologies Pvt. Ltd.**, Bengaluru, India

Part of the **5serving · WorkFromFarms** initiative.

Built with [Claude Code](https://claude.ai/code) + [Anthropic API](https://console.anthropic.com).

---

*Last updated: May 2026*
