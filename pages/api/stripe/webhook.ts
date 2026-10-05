import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/invoicing/checkout";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest) {
  const parts: Buffer[] = [];
  for await (const chunk of req) {
    parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(parts as unknown as Uint8Array[]).toString("utf8");
}

/** Stripe webhook: fulfill invoices on Checkout payment. Signature-verified. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "Webhook secret is not configured" });

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") return res.status(400).json({ error: "Missing Stripe signature" });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(await readRawBody(req), signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return res.status(400).json({ error: message });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook failed", event.type, error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
