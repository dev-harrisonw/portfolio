import { useEffect, useState } from "react";
import { formatMinutes, formatMoney } from "@/lib/billing";
import { api } from "@/lib/fetcher";

export default function InvoiceOverage({
  invoiceId,
  currency,
  billOverages,
  overageMinutes,
  overageAmount,
  editable,
  onChange,
  onError,
}: {
  invoiceId: string;
  currency: string;
  billOverages: boolean;
  overageMinutes: number;
  overageAmount: number;
  editable: boolean;
  onChange: () => void;
  onError: (message: string) => void;
}) {
  const [on, setOn] = useState(billOverages);
  const [busy, setBusy] = useState(false);
  useEffect(() => setOn(billOverages), [billOverages]);

  async function toggle() {
    if (!editable || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      await api(`/api/admin/invoices/${invoiceId}`, { method: "PATCH", body: { billOverages: next } });
      onChange();
    } catch (error) {
      setOn(!next);
      onError(error instanceof Error ? error.message : "Could not update the invoice");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dd-panel mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {formatMinutes(overageMinutes)} over the allowance
          {overageAmount > 0 ? ` · ${formatMoney(overageAmount, currency)}` : ""}
        </p>
        <p className="text-xs text-fun-gray-medium mt-0.5">
          {on ? "These hours are added as a line on this invoice." : "These hours stay in the time log and are left off this invoice."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Charge the extra hours"
        disabled={!editable || busy}
        onClick={toggle}
        className="flex items-center gap-2 text-sm disabled:opacity-60"
      >
        <span className="text-fun-gray-light">Charge extra hours</span>
        <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-fun-pink" : "bg-[color:var(--dd-border-strong)]"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
        </span>
      </button>
    </div>
  );
}
