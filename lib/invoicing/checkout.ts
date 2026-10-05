import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/site";
import { voidInvoice } from "@/lib/invoicing/generate";
import { emailInvoice } from "@/lib/email";
import type { Invoice, InvoiceStatus } from "@prisma/client";
import type Stripe from "stripe";

const OPEN: InvoiceStatus[] = ["DRAFT", "SENT"];

function integrationId() {
  const suffix = Math.random().toString(36).slice(2, 10);
  return `invpay_${suffix}`;
}

async function ensureCustomer(client: { id: string; name: string; billingEmail: string; stripeCustomerId: string | null }) {
  if (client.stripeCustomerId) return client.stripeCustomerId;
  const customer = await getStripe().customers.create({
    email: client.billingEmail,
    name: client.name,
    metadata: { clientId: client.id },
  });
  await prisma.client.update({ where: { id: client.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

async function liveCheckoutUrl(sessionId: string | null) {
  if (!sessionId) return null;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.status === "open" && session.url) return { session, url: session.url };
  } catch {
    return null;
  }
  return null;
}

/** Create or reuse a Stripe Checkout session for an invoice. Marks it SENT. */
export async function sendInvoice(invoiceId: string, opts: { email?: boolean } = {}): Promise<{ invoice: Invoice; url: string }> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: { select: { id: true, name: true, billingEmail: true, stripeCustomerId: true } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  if (invoice.status === "VOID") throw new HttpError(409, "Voided invoices can't be sent");
  if (invoice.status === "PAID") throw new HttpError(409, "This invoice is already paid");
  if (!OPEN.includes(invoice.status)) throw new HttpError(409, "This invoice can't be sent");

  const notify = async (url: string, record: Invoice) => {
    if (!opts.email) return;
    try {
      await emailInvoice({
        invoice: { ...invoice, ...record, client: { name: invoice.client.name, billingEmail: invoice.client.billingEmail } },
        to: invoice.client.billingEmail,
        checkoutUrl: url,
      });
    } catch (error) {
      console.error("Invoice email failed", invoice.number, error);
    }
  };

  const existing = await liveCheckoutUrl(invoice.stripeCheckoutSessionId);
  if (existing) {
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "SENT",
        sentAt: invoice.sentAt ?? new Date(),
        checkoutUrl: existing.url,
      },
    });
    await notify(existing.url, updated);
    return { invoice: updated, url: existing.url };
  }

  const customer = await ensureCustomer(invoice.client);
  const origin = siteUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer,
    client_reference_id: invoice.id,
    metadata: { invoiceId: invoice.id, invoiceNumber: invoice.number },
    success_url: `${origin}/portal?paid=${invoice.id}`,
    cancel_url: `${origin}/portal`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: invoice.total,
          product_data: {
            name: `Invoice ${invoice.number}`,
            description: invoice.kind === "STAGE" ? "Project payment" : "Period invoice",
          },
        },
      },
    ],
    integration_identifier: integrationId(),
  });
  if (!session.url) throw new HttpError(502, "Stripe did not return a checkout URL");

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "SENT",
      sentAt: invoice.sentAt ?? new Date(),
      stripeCheckoutSessionId: session.id,
      checkoutUrl: session.url,
    },
  });
  await notify(session.url, updated);
  return { invoice: updated, url: session.url };
}

async function setPaid(
  invoiceId: string,
  extra: { stripeCheckoutSessionId?: string; checkoutUrl?: string | null } = {}
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.status === "VOID" || invoice.status === "PAID") return invoice;
  const [updated] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        ...(extra.stripeCheckoutSessionId ? { stripeCheckoutSessionId: extra.stripeCheckoutSessionId } : {}),
        ...(extra.checkoutUrl !== undefined ? { checkoutUrl: extra.checkoutUrl } : {}),
      },
    }),
    prisma.paymentStage.updateMany({ where: { invoiceId }, data: { status: "PAID" } }),
  ]);
  return updated;
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status === "unpaid") return;
  const invoiceId = session.metadata?.invoiceId || session.client_reference_id;
  if (!invoiceId) return;
  await setPaid(invoiceId, { stripeCheckoutSessionId: session.id, checkoutUrl: session.url });
}

/** Record an offline payment (bank transfer, cash) and close any open Checkout session. */
export async function markInvoicePaid(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new HttpError(404, "Invoice not found");
  if (invoice.status === "VOID") throw new HttpError(409, "Voided invoices can't be marked paid");
  if (invoice.status === "PAID") return invoice;
  await expireCheckout(invoiceId);
  const paid = await setPaid(invoiceId);
  if (!paid) throw new HttpError(409, "This invoice can't be marked paid");
  return paid;
}

export async function expireCheckout(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { stripeCheckoutSessionId: true },
  });
  if (!invoice?.stripeCheckoutSessionId || !process.env.STRIPE_SECRET_KEY) return;
  try {
    await getStripe().checkout.sessions.expire(invoice.stripeCheckoutSessionId);
  } catch {
    // Already expired, completed, or never opened.
  }
}

export async function voidInvoiceWithCheckout(invoiceId: string) {
  await expireCheckout(invoiceId);
  await voidInvoice(invoiceId);
}
