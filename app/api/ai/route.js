export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    const { prompt, system } = await request.json();

    // Strip BOM (﻿) and newlines that can be injected when env vars are set via stdin
    const apiKey = (process.env.ANTHROPIC_API_KEY || "").replace(/﻿/g, "").replace(/\n/g, "").trim();
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system:
        system ||
        "You are a warm, helpful assistant for 5serving FarmMarket — an Indian farmers marketplace. Keep responses concise and practical.",
      messages: [{ role: "user", content: prompt }],
    });

    return Response.json({ text: response.content[0].text });
  } catch (err) {
    return Response.json({ text: "AI response unavailable right now." }, { status: 500 });
  }
}
