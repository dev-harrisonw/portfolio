import { formatMinutes, formatMoney } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";
import type { InvoiceDraft } from "@/lib/invoicing/calc";
import HoursRing from "@/components/portal/HoursRing";
import BarChart from "@/components/dashboard/BarChart";
import { paceText, paceTone } from "@/components/dashboard/pace";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

const card = "rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-5";
const DAY_MS = 86400000;

function weeklyBars(usage: ClientUsage) {
  const start = new Date(usage.period.start).getTime();
  const weeks = Math.ceil(usage.period.days.total / 7);
  const bars = Array.from({ length: weeks }, (_, i) => {
    const from = new Date(start + i * 7 * DAY_MS);
    return {
      label: from.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      title: `Week of ${from.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`,
      primary: 0,
      secondary: 0,
    };
  });
  for (const e of usage.entries) {
    const bar = bars[Math.floor((new Date(e.startedAt).getTime() - start) / (7 * DAY_MS))];
    if (!bar) continue;
    if (e.billable) bar.primary += e.durationMinutes;
    else bar.secondary += e.durationMinutes;
  }
  return bars;
}

type Props = { usage: ClientUsage; estimate: InvoiceDraft; projected: InvoiceDraft };

export default function PortalDashboard({ usage, estimate, projected }: Props) {
  const main = usage.allowances[0];
  const tone = paceTone[main.overageMinutes > 0 ? "over" : main.pace.status];
  const currency = usage.client.currency;

  return (
    <MotionSection className="grid gap-4 lg:grid-cols-3 mb-10">
      <MotionItem className={`${card} flex flex-col items-center justify-center lg:row-span-2`}>
        <HoursRing used={main.usedMinutes} available={main.availableMinutes} />
        <p className={`mt-4 rounded-full px-3 py-1 text-xs text-center ${tone}`}>{paceText(main, "client")}</p>
        {main.carriedInMinutes > 0 && (
          <p className="text-xs text-fun-gray-medium mt-2">Includes {formatMinutes(main.carriedInMinutes)} rolled over</p>
        )}
      </MotionItem>

      <MotionItem className={card}>
        <p className="text-xs uppercase tracking-wider text-fun-gray-light">Billing period</p>
        {usage.period.isCurrent ? (
          <>
            <p className="text-3xl font-bold mt-1">
              {usage.period.days.left}
              <span className="text-base font-normal text-fun-gray-medium"> days left</span>
            </p>
            <div className="mt-3 h-1.5 rounded-full bg-fun-gray-darker">
              <div className="h-full rounded-full bg-fun-gray-light" style={{ width: `${(usage.period.days.elapsed / usage.period.days.total) * 100}%` }} />
            </div>
          </>
        ) : (
          <p className="text-3xl font-bold mt-1">Closed</p>
        )}
        <p className="text-xs text-fun-gray-medium mt-2">
          {new Date(usage.period.start).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} –{" "}
          {new Date(new Date(usage.period.end).getTime() - DAY_MS).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
        </p>
      </MotionItem>

      <MotionItem className={card}>
        <p className="text-xs uppercase tracking-wider text-fun-gray-light">{usage.period.isCurrent ? "Estimated invoice" : "Invoice amount"}</p>
        <p className="text-3xl font-bold mt-1 font-monospace">{formatMoney(estimate.total, currency)}</p>
        {usage.period.isCurrent && projected.total !== estimate.total && (
          <p className="text-xs text-fun-gray-medium mt-2">About {formatMoney(projected.total, currency)} by period end at the current pace</p>
        )}
        {estimate.vat > 0 && <p className="text-xs text-fun-gray-medium mt-1">Includes VAT {formatMoney(estimate.vat, currency)}</p>}
      </MotionItem>

      <MotionItem className={`${card} lg:col-span-2`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-fun-gray-light">Hours per week</p>
          <p className="text-xs text-fun-gray-medium">{formatMinutes(usage.totals.billableMinutes)} billable</p>
        </div>
        <BarChart bars={weeklyBars(usage)} height={110} />
      </MotionItem>
    </MotionSection>
  );
}
