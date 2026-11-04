import { Resend } from "resend";
import { formatMoney } from "@/lib/billing";
import { siteUrl } from "@/lib/site";
import { renderInvoicePdf, type InvoicePdfData } from "@/lib/exports/InvoicePdf";

function fromAddress() {
  return process.env.INVOICE_FROM_EMAIL || "";
}

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key || !fromAddress()) return null;
  return new Resend(key);
}

export async function emailInvoice(opts: {
  invoice: InvoicePdfData;
  to: string;
  checkoutUrl: string;
  reminder?: boolean;
}) {
  const resend = resendClient();
  if (!resend) return { skipped: true as const };

  const { invoice, to, checkoutUrl, reminder } = opts;
  const origin = siteUrl();
  const pdf = await renderInvoicePdf(invoice);
  const bytes = Buffer.from(Uint8Array.from(pdf));
  const amount = formatMoney(invoice.total, invoice.currency);
  const due = invoice.dueAt
    ? new Date(invoice.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  const { error } = await resend.emails.send(
    {
      from: fromAddress(),
      to: [to],
      subject: reminder
        ? `Reminder: invoice ${invoice.number} · ${amount}`
        : `Invoice ${invoice.number} from Harrison Warburton · ${amount}`,
      html: reminder
        ? `
        <p>Hi ${invoice.client.name},</p>
        <p>Just a nudge — invoice <strong>${invoice.number}</strong> (${amount})${due ? ` was due ${due}` : " is still unpaid"}.</p>
        <p><a href="${checkoutUrl}">Pay this invoice</a> or <a href="${origin}/portal">open the client portal</a>.</p>
        <p>A PDF copy is attached.</p>
        <p>— Harrison</p>
      `
        : `
        <p>Hi ${invoice.client.name},</p>
        <p>Invoice <strong>${invoice.number}</strong> is ready (${amount}).</p>
        <p><a href="${checkoutUrl}">Pay this invoice</a> or <a href="${origin}/portal">open the client portal</a>.</p>
        <p>A PDF copy is attached.</p>
        <p>— Harrison</p>
      `,
      attachments: [{ filename: `${invoice.number}.pdf`, content: bytes }],
    },
    { idempotencyKey: `${reminder ? "invoice-reminder" : "invoice-email"}/${invoice.number}/${Math.floor(Date.now() / 60000)}` }
  );

  if (error) {
    console.error("Invoice email failed", invoice.number, error.message);
    return { skipped: false as const, error: error.message };
  }
  return { skipped: false as const };
}

function esc(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}

function brandedEmail(opts: { lead: string; highlight: string; body: string; action: string; href: string; note: string }) {
  const href = esc(opts.href);
  const preview = esc(`${siteUrl()}/static/email/portal-preview.png`);
  const font = "'Be Vietnam Pro',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  return `<!doctype html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;background:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#333333;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="font-family:${font};font-size:20px;line-height:1.3;color:#ffffff;">Hi, I'm Harrison.</td></tr>
        <tr><td style="padding-top:12px;font-family:${font};font-size:34px;line-height:1.05;letter-spacing:-0.045em;font-weight:700;color:#ffffff;">${esc(opts.lead)} <span style="color:#3BB143;">${esc(opts.highlight)}</span>.</td></tr>
        <tr><td style="padding-top:16px;font-family:${font};font-size:16px;line-height:1.55;color:#dadbdd;">${opts.body}</td></tr>
        <tr><td style="padding-top:24px;">
          <img src="${preview}" width="600" alt="Sample of the portal for a made-up client, Acme Ltd. 18 hours left of 40, an invoice for £1,500, and hours by week." style="display:block;width:100%;max-width:600px;height:auto;border-radius:16px;border:0;">
        </td></tr>
        <tr><td style="padding-top:8px;font-family:${font};font-size:12px;line-height:1.45;color:#b2bbcf;">A sample, using a made-up client. Yours shows your own hours and invoices.</td></tr>
        <tr><td style="padding-top:24px;">
          <a href="${href}" style="display:inline-block;background:#3BB143;color:#ffffff;text-decoration:none;font-family:${font};font-weight:700;font-size:16px;line-height:1;padding:14px 28px;border-radius:999px;border:2px solid #3BB143;">${esc(opts.action)}</a>
        </td></tr>
        <tr><td style="padding-top:16px;font-family:${font};font-size:13px;line-height:1.5;color:#b2bbcf;">${opts.note}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendBranded(opts: { to: string; subject: string; text: string; html: string; key: string }) {
  const resend = resendClient();
  if (!resend) return { skipped: true as const };

  const { error } = await resend.emails.send(
    { from: fromAddress(), to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text },
    { idempotencyKey: `${opts.key}/${Math.floor(Date.now() / 60000)}` }
  );
  if (error) {
    console.error("Portal email failed", error.message);
    return { skipped: false as const, error: error.message };
  }
  return { skipped: false as const };
}

/** Branded replacement for Clerk's default invitation email. `inviteUrl` already contains the sign-up ticket. */
export function emailPortalInvite(opts: { to: string; clientName: string; inviteUrl: string; signInUrl: string }) {
  const client = esc(opts.clientName);
  const email = esc(opts.to);
  return sendBranded({
    to: opts.to,
    subject: `The ${opts.clientName} portal`,
    key: `portal-invite/${opts.to}`,
    text: `Hi, I'm Harrison.\n\nYou're invited to the portal for ${opts.clientName}. Hours, invoices and payments are in one place.\n\nOpen it: ${opts.inviteUrl}\n\nThis link is for ${opts.to}. If you already have a sign-in, use ${opts.signInUrl}.\n\n— Harrison`,
    html: brandedEmail({
      lead: "You're",
      highlight: "invited",
      body: `I've opened a portal for <strong>${client}</strong>. Hours, invoices and payments are in one place.`,
      action: "Open the portal",
      href: opts.inviteUrl,
      note: `This link is for ${email}. Already have a sign-in? <a href="${esc(opts.signInUrl)}" style="color:#3BB143;">Use it here</a>.`,
    }),
  });
}

export function emailPortalReady(opts: { to: string; clientName: string; signInUrl: string }) {
  const client = esc(opts.clientName);
  return sendBranded({
    to: opts.to,
    subject: `The ${opts.clientName} portal`,
    key: `portal-ready/${opts.to}`,
    text: `Hi, I'm Harrison.\n\nYour portal for ${opts.clientName} is ready. Hours, invoices and payments are in one place.\n\nOpen it: ${opts.signInUrl}\n\nSign in with ${opts.to}.\n\n— Harrison`,
    html: brandedEmail({
      lead: "Your portal is",
      highlight: "ready",
      body: `Hours, invoices and payments for <strong>${client}</strong> are in one place.`,
      action: "Open the portal",
      href: opts.signInUrl,
      note: "Sign in with the email this was sent to.",
    }),
  });
}
