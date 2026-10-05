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
}) {
  const resend = resendClient();
  if (!resend) return { skipped: true as const };

  const { invoice, to, checkoutUrl } = opts;
  const origin = siteUrl();
  const pdf = await renderInvoicePdf(invoice);
  const bytes = Buffer.from(Uint8Array.from(pdf));
  const amount = formatMoney(invoice.total, invoice.currency);

  const { error } = await resend.emails.send(
    {
      from: fromAddress(),
      to: [to],
      subject: `Invoice ${invoice.number} from Harrison Warburton · ${amount}`,
      html: `
        <p>Hi ${invoice.client.name},</p>
        <p>Invoice <strong>${invoice.number}</strong> is ready (${amount}).</p>
        <p><a href="${checkoutUrl}">Pay this invoice</a> or <a href="${origin}/portal">open the client portal</a>.</p>
        <p>A PDF copy is attached.</p>
        <p>— Harrison</p>
      `,
      attachments: [{ filename: `${invoice.number}.pdf`, content: bytes }],
    },
    { idempotencyKey: `invoice-email/${invoice.number}/${Math.floor(Date.now() / 60000)}` }
  );

  if (error) {
    console.error("Invoice email failed", invoice.number, error.message);
    return { skipped: false as const, error: error.message };
  }
  return { skipped: false as const };
}
