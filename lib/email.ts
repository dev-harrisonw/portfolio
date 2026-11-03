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

function brandedEmail(opts: { headline: string; body: string; action: string; href: string; note: string }) {
  const href = esc(opts.href);
  return `<!doctype html>
<html>
<body style="margin:0;background:#16191f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#16191f;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1d2129;border:1px solid #2b303b;border-radius:12px;">
        <tr><td style="padding:28px 28px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;">Harrison <span style="color:#3bb143;">Warburton</span></td></tr>
        <tr><td style="padding:8px 28px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8d95a6;">Client portal</td></tr>
        <tr><td style="padding:18px 28px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:18px;line-height:1.4;color:#ffffff;">${esc(opts.headline)}</td></tr>
        <tr><td style="padding:10px 28px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#e7eaf0;">${opts.body}</td></tr>
        <tr><td style="padding:22px 28px 0;"><a href="${href}" style="display:inline-block;background:#3bb143;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px;">${esc(opts.action)}</a></td></tr>
        <tr><td style="padding:16px 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:#8d95a6;">${opts.note}<br><br><span style="word-break:break-all;">${href}</span></td></tr>
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
    subject: `Your ${opts.clientName} portal is ready`,
    key: `portal-invite/${opts.to}`,
    text: `You're invited to the client portal for ${opts.clientName}.\n\nOpen this link to create your sign-in and view hours and invoices:\n${opts.inviteUrl}\n\nUse ${opts.to}. If you already have an account, sign in at ${opts.signInUrl}.\n\n— Harrison`,
    html: brandedEmail({
      headline: `You're invited to the ${opts.clientName} portal`,
      body: `Use this to see hours, invoices and payments for <strong>${client}</strong>. The button creates your sign-in for <strong>${email}</strong> and opens the portal.`,
      action: "Open the portal",
      href: opts.inviteUrl,
      note: `Already got an account? <a href="${esc(opts.signInUrl)}" style="color:#3bb143;">Sign in</a> with the same email address.`,
    }),
  });
}

export function emailPortalReady(opts: { to: string; clientName: string; signInUrl: string }) {
  const client = esc(opts.clientName);
  return sendBranded({
    to: opts.to,
    subject: `Sign in to the ${opts.clientName} portal`,
    key: `portal-ready/${opts.to}`,
    text: `Your account can now open the client portal for ${opts.clientName}.\n\nSign in at ${opts.signInUrl}\n\nUse ${opts.to}.\n\n— Harrison`,
    html: brandedEmail({
      headline: `The ${opts.clientName} portal is open`,
      body: `Your account can now see hours, invoices and payments for <strong>${client}</strong>. Sign in with <strong>${esc(opts.to)}</strong>.`,
      action: "Sign in",
      href: opts.signInUrl,
      note: "This mailbox is the one with access. A different login won't see this client.",
    }),
  });
}
