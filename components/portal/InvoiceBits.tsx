import { useState } from "react";
import { api } from "@/lib/fetcher";

export type PortalInvoice = {
  id: string;
  number: string;
  status: string;
  total: number;
  vat: number;
  kind: string;
  createdAt: string;
  dueAt: string | null;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

const DAY_MS = 86400000;
export const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

export function isOverdue(inv: PortalInvoice, now = Date.now()) {
  return inv.status === "SENT" && inv.dueAt != null && new Date(inv.dueAt).getTime() + DAY_MS <= now;
}

type Dated = { periodStart: Date | string | null; periodEnd: Date | string | null; createdAt: Date | string };

/** The invoice covering a viewed period. Partial first months (billed 14–30 Sep) still match September. */
export function invoiceForPeriod<T extends Dated>(invoices: T[], period: { start: Date | string; end: Date | string }): T | null {
  const start = new Date(period.start).getTime();
  const end = new Date(period.end).getTime();
  let best: { inv: T; overlap: number; created: number } | null = null;
  for (const inv of invoices) {
    if (!inv.periodStart || !inv.periodEnd) continue;
    const overlap = Math.min(new Date(inv.periodEnd).getTime(), end) - Math.max(new Date(inv.periodStart).getTime(), start);
    if (overlap <= 0) continue;
    const created = new Date(inv.createdAt).getTime();
    if (!best || overlap > best.overlap || (overlap === best.overlap && created > best.created)) best = { inv, overlap, created };
  }
  return best?.inv ?? null;
}

/**
 * The invoice charges the hours logged, not the retainer the client is on now.
 * September was billed 22h × £37.50; applying today's £1,500 retainer to that month is wrong.
 */
export function billedAsHours(
  invoice: PortalInvoice,
  usage: { totals: { billableMinutes: number }; client: { hourlyRate: number; retainerAmount: number | null } }
) {
  if (usage.client.retainerAmount == null || usage.totals.billableMinutes <= 0) return false;
  const hourly = Math.round((usage.totals.billableMinutes * usage.client.hourlyRate) / 60);
  const net = invoice.total - invoice.vat;
  return Math.abs(net - hourly) <= 1 && net !== usage.client.retainerAmount;
}

export function invoicePeriodLabel(inv: PortalInvoice) {
  if (inv.kind === "STAGE") return "Project payment";
  if (!inv.periodStart || !inv.periodEnd) return "Billing period";
  const last = new Date(new Date(inv.periodEnd).getTime() - DAY_MS).toISOString();
  return `${fmtDay(inv.periodStart)} – ${fmtDay(last, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** One line describing where the invoice stands, e.g. "Paid 19 Oct" or "Due 14 Nov". */
export function invoiceDateNote(inv: PortalInvoice) {
  if (inv.status === "PAID") return inv.paidAt ? `Paid ${fmtDay(inv.paidAt)}` : "Paid";
  if (inv.status === "SENT" && inv.dueAt) return `${isOverdue(inv) ? "Was due" : "Due"} ${fmtDay(inv.dueAt)}`;
  if (inv.status === "DRAFT") return "Draft, not sent yet";
  return null;
}

export function InvoiceStatusPill({ invoice }: { invoice: PortalInvoice }) {
  const overdue = isOverdue(invoice);
  const [label, tone] =
    invoice.status === "PAID"
      ? ["Paid", "text-green-300 bg-green-500/10"]
      : overdue
      ? ["Overdue", "text-red-300 bg-red-500/10"]
      : invoice.status === "SENT"
      ? ["Awaiting payment", "text-yellow-300 bg-yellow-500/10"]
      : ["Draft", "text-fun-gray-light bg-fun-gray-darker"];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${tone}`}>{label}</span>;
}

export function invoicePdfHref(id: string, clientId?: string) {
  return `/api/portal/invoices/${id}?${new URLSearchParams({ format: "pdf", ...(clientId ? { client: clientId } : {}) })}`;
}

export function PayButton({ invoiceId, clientId }: { invoiceId: string; clientId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        className="rounded-md bg-fun-pink px-3 py-1.5 text-xs font-bold text-white hover:bg-fun-pink-light disabled:opacity-40 min-h-[40px] sm:min-h-0"
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            const qs = clientId ? `?client=${encodeURIComponent(clientId)}` : "";
            const { url } = await api<{ url: string }>(`/api/portal/invoices/${invoiceId}/pay${qs}`);
            window.location.href = url;
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "Opening…" : "Pay now"}
      </button>
      {error && <span className="mt-1 text-[11px] text-red-400 max-w-[12rem] text-right">{error}</span>}
    </span>
  );
}
