import type { NextApiRequest, NextApiResponse } from "next";
import { services } from "@/data/content/services";

const MAX_MESSAGE = 2000;
const MAX_ANSWERS = 2000;

/**
 * Optional streaming-ish AI reply for /hire.
 * Falls back to a scripted response when OPENAI_API_KEY is missing.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, answers } = req.body || {};
  // Public endpoint that spends OpenAI credit: cap what a single request can send.
  const userMessage =
    typeof message === "string" && message.trim()
      ? message.trim().slice(0, MAX_MESSAGE)
      : "Help me start a website project.";

  const serviceList = services.map((s) => `- ${s.title}: ${s.blurb}`).join("\n");
  const context =
    answers && typeof answers === "object"
      ? `Known answers so far: ${JSON.stringify(answers).slice(0, MAX_ANSWERS)}`
      : "No structured answers yet.";

  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      reply: `Happy to help. I build marketing sites, catalogues, and small web apps.\n\nServices I offer:\n${serviceList}\n\nUse the guided steps on this page (or share budget, timeline, and goals) and I'll turn it into a clear enquiry.`,
      provider: "fallback",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are Harrison's portfolio hire assistant. Be concise, confident, and helpful. You help qualify website/app enquiries. Services:\n${serviceList}\nAsk at most one clarifying question if needed. End by encouraging them to complete the guided form or email me@harrisonwarburton.com.`,
          },
          {
            role: "user",
            content: `${context}\n\nUser: ${userMessage}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("hire chat: OpenAI error", response.status, await response.text());
      return res.status(502).json({ error: "The assistant is unavailable right now" });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content ||
      "Thanks — complete the guided form and I'll follow up by email.";

    return res.status(200).json({ reply, provider: "openai" });
  } catch {
    return res.status(500).json({ error: "AI request failed" });
  }
}
