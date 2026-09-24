import connectDB from "@/lib/mongoose";
import Produce from "@/models/Produce";
import Order from "@/models/Order";
import Anthropic from "@anthropic-ai/sdk";
import { getAuth } from "@/lib/auth";

const client = new Anthropic();

export async function POST(request) {
  try {
    const auth = getAuth(request);
    if (!auth || auth.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectDB();

    const produce = await Produce.find({ available: true }).sort({ category: 1 });
    if (!produce.length) {
      return Response.json({ error: "No produce listed on the platform yet." }, { status: 400 });
    }

    // Order volume per produce (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({ createdAt: { $gte: since }, orderStatus: { $ne: "cancelled" } });
    const volume = {};
    recentOrders.forEach(o =>
      o.items?.forEach(i => { volume[i.produceName] = (volume[i.produceName] || 0) + i.qty; })
    );

    const produceList = produce.map(p => ({
      name:           p.name,
      category:       p.category,
      farmer_price:   p.price,
      unit:           p.unit,
      farmer:         p.farmerName,
      location:       p.village,
      organic:        p.organic,
      qty_available:  p.quantity,
      sold_last_30d:  volume[p.name] || 0,
    }));

    const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const prompt = `You are a senior agricultural market analyst for 5serving FarmMarket, a direct farm-to-consumer platform in India connecting farmers in Karnataka, Maharashtra, and Tamil Nadu with urban buyers — zero middlemen.

Date: ${today}

Produce currently listed on the platform:
${JSON.stringify(produceList, null, 2)}

Your task:
1. For each item, estimate the current realistic RETAIL price a city buyer would pay at a supermarket or wet market (Bengaluru / South India context, June 2026).
2. Also estimate the WHOLESALE / MANDI price a farmer would receive if selling through traditional channels.
3. Calculate buyer savings (retail vs farmer price) and farmer income premium (farmer price vs mandi).
4. Provide honest status for each item and a one-line insight.
5. Write an executive summary and actionable highlights.

Respond ONLY with valid JSON — no markdown fences, no text outside the JSON:

{
  "report_date": "${new Date().toISOString().slice(0, 10)}",
  "market_context": "One sentence on June 2026 Indian produce market conditions.",
  "executive_summary": "2-3 sentences summarising the platform's overall value creation for both buyers and farmers.",
  "items": [
    {
      "produce_name": "exact name from input",
      "category": "category from input",
      "farmer_price": number,
      "unit": "unit from input",
      "retail_market_price": number,
      "wholesale_mandi_price": number,
      "buyer_savings_per_unit": number,
      "buyer_savings_percent": number,
      "farmer_premium_over_mandi": number,
      "farmer_premium_percent": number,
      "organic": true or false,
      "sold_last_30d": number,
      "status": "great-deal" | "competitive" | "fair" | "above-market",
      "insight": "One specific, data-backed insight about this item."
    }
  ],
  "platform_highlights": [
    "4 to 5 specific, data-backed highlights (use numbers) about value this platform creates for buyers and farmers."
  ],
  "avg_buyer_savings_percent": number,
  "avg_farmer_premium_percent": number,
  "est_monthly_buyer_savings_inr": number,
  "recommendation": "One specific, actionable recommendation for the admin to further improve platform value."
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return valid JSON");

    const report = JSON.parse(match[0]);
    return Response.json(report);
  } catch (err) {
    console.error("[market-report]", err.message);
    return Response.json({ error: err.message || "Failed to generate report" }, { status: 500 });
  }
}
