import Stripe from "stripe";
import { HttpError } from "@/lib/api";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, "Payments aren't configured yet");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}
