import type { ReactNode } from "react";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";
import type { InvoiceDraft } from "@/lib/invoicing/calc";
import HoursRing from "@/components/portal/HoursRing";
import BarChart from "@/components/dashboard/BarChart";
import { paceText, paceTone } from "@/components/dashboard/pace";
import { MotionItem, MotionSection } from "@/components/utility/Motion";
import {
  InvoiceStatusPill,
  PayButton,
  invoiceDateNote,
  invoicePdfHref,
  type PortalInvoice,
} from "@/components/portal/InvoiceBits";

const card = "rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 sm:p-5";
const label = "text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light";
const DAY_MS = 86400000;

/** Weekly totals, splitting billable time into what the allowance covers and what goes over it. */
function weeklyBars(usage: ClientUsage, available: number | null) {
  const start = new Date(usage.period.start).getTime();
  const weeks = Math.ceil(usage.period.days.total / 7);
  const bars = Array.from({ length: weeks }, (_, i) => {
    const from = new Date(start + i * 7 * DAY_MS);
    return {
      label: from.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      title: `Week of ${from.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`,
      primary: 0,
      secondary: 0,
      over: 0,
    };
  });
  let used = 0;
  for (const e of usage.entries) {
    const bar = bars[Math.floor((new Date(e.startedAt).getTime() - start) / (7 * DAY_MS))];
    if (!bar) continue;
    if (!e.billable) {
      bar.secondary += e.durationMinutes;
      continue;
    }
    const covered = available == null ? e.durationMinutes : Math.max(0, Math.min(e.durationMinutes, available - used));
    bar.primary += covered;
    bar.over += e.durationMinutes - covered;
    used += e.durationMinutes;
  }
  return bars;
}

function Row({ name, value, tone }: { name: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-sm text-fun-gray-light">{name}</span>
      <span className={`font-monospace text-sm tabular-nums text-right ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function Legend({ swatch, text }: { swatch: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-sm ${swatch}`} />
      {text}
    </span>
  );
}

type Props = {
  usage: ClientUsage;
  estimate: InvoiceDraft;
  projected: InvoiceDraft;
  periodInvoice: PortalInvoice | null;
  clientId?: string;
};

export default function PortalDashboard({ usage, estimate, projected, periodInvoice, clientId }: Props) {
  const main = usage.allowances[0];
  const closed = !usage.period.isCurrent;
  const tone = paceTone[main.overageMinutes > 0 ? "over" : main.pace.status];
  const currency = usage.client.currency;
  const bars = weeklyBars(usage, main.availableMinutes);
  const hasOver = bars.some((b) => b.over > 0);
  const hasUnbilled = bars.some((b) => b.secondary > 0);
  const overNote = usage.client.billOverages ? "billed at the hourly rate" : "not billed";

  return (
    <MotionSection className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
      <MotionItem className={`${card} col-span-2 lg:col-span-1 lg:row-span-2 flex flex-row lg:flex-col lg:justify-center items-center gap-4 sm:gap-5`}>
        <HoursRing used={main.usedMinutes} available={main.availableMinutes} />
        <div className="min-w-0 flex-1 lg:flex-none text-left lg:text-center">
          <p className={`rounded-full px-3 py-1 text-xs inline-block max-w-full ${tone}`}>
            {paceText(main, "client", { closed, billOverages: usage.client.billOverages })}
          </p>
          {main.carriedInMinutes > 0 && (
            <p className="text-xs text-fun-gray-medium mt-2">Includes {formatMinutes(main.carriedInMinutes)} rolled over</p>
          )}
        </div>
      </MotionItem>

      <MotionItem className={`${card} col-span-2 sm:col-span-1`}>
        <p className={label}>Hours</p>
        <div className="mt-2 divide-y divide-fun-gray-darker">
          {main.availableMinutes != null ? (
            <Row name="Included" value={formatMinutes(main.availableMinutes)} />
          ) : (
            <Row name="Plan" value="Pay as you go" />
          )}
          <Row name="Logged" value={formatMinutes(main.usedMinutes)} tone="font-bold text-white" />
          {main.availableMinutes != null &&
            (main.overageMinutes > 0 ? (
              <Row
                name="Over allowance"
                tone="text-red-300"
                value={
                  <>
                    {formatMinutes(main.overageMinutes)}
                    <span className="block text-[11px] font-sans">{overNote}</span>
                  </>
                }
              />
            ) : (
              <Row name={closed ? "Unused" : "Remaining"} value={formatMinutes(main.remainingMinutes ?? 0)} />
            ))}
          {usage.totals.nonBillableMinutes > 0 && (
            <Row name="Extra, not billed" value={formatMinutes(usage.totals.nonBillableMinutes)} tone="text-fun-gray-medium" />
          )}
        </div>
      </MotionItem>

      <MotionItem className={`${card} col-span-2 sm:col-span-1 flex flex-col`}>
        {periodInvoice ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className={label}>Invoice {periodInvoice.number}</p>
              <InvoiceStatusPill invoice={periodInvoice} />
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 font-monospace leading-tight break-all">
              {formatMoney(periodInvoice.total, currency)}
            </p>
            <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-1">{invoiceDateNote(periodInvoice)}</p>
            <div className="mt-auto pt-3 flex items-center gap-3">
              {periodInvoice.status === "SENT" && <PayButton invoiceId={periodInvoice.id} clientId={clientId} />}
              {periodInvoice.status !== "DRAFT" && (
                <a href={invoicePdfHref(periodInvoice.id, clientId)} className="text-sm text-fun-pink-light hover:underline">
                  Download PDF
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <p className={label}>{closed ? "Not invoiced yet" : "Estimated invoice"}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 font-monospace leading-tight break-all">
              {formatMoney(estimate.total, currency)}
            </p>
            {!closed && projected.total !== estimate.total && (
              <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-2 leading-snug">
                About {formatMoney(projected.total, currency)} by period end at the current pace
              </p>
            )}
            {estimate.vat > 0 && (
              <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-1">Includes VAT {formatMoney(estimate.vat, currency)}</p>
            )}
            {main.overageMinutes > 0 && !usage.client.billOverages && (
              <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-1">Hours over the allowance aren't charged</p>
            )}
          </>
        )}
      </MotionItem>

      <MotionItem className={`${card} col-span-2`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className={label}>Hours per week</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-fun-gray-medium">
            <Legend swatch="bg-fun-pink" text={main.availableMinutes != null ? "Within allowance" : "Billable"} />
            {hasOver && <Legend swatch="bg-red-400/80" text={`Over allowance${usage.client.billOverages ? "" : " (not billed)"}`} />}
            {hasUnbilled && <Legend swatch="bg-fun-gray-medium/50" text="Not billed" />}
          </div>
        </div>
        <BarChart bars={bars} height={96} />
      </MotionItem>
    </MotionSection>
  );
}
