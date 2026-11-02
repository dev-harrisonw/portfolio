import { useState } from "react";
import { api } from "@/lib/fetcher";

export type PortalInvoice = {
  id: string;
  number: string;
  status: string;
  total: number;
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
