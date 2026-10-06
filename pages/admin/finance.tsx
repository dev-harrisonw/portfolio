import Link from "next/link";
import type { GetServerSideProps } from "next";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { FinanceDashboard, MoneyBucket } from "@/lib/finance";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/admin/Form";
import BarChart from "@/components/dashboard/BarChart";
import { dueLabel, invoiceStatusTone } from "@/lib/clients";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

type Props = { data: FinanceDashboard };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const { getFinanceDashboard } = await import("@/lib/finance");
  const data = await getFinanceDashboard();
  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

function money(list: MoneyBucket[], fallback: { currency: string; amount: number }) {
  if (list.length === 0) return formatMoney(fallback.amount, fallback.currency);
  return list.map((b) => formatMoney(b.amount, b.currency)).join(" · ");
}

function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <Card className="min-w-0 h-full">
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light leading-tight">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1 font-monospace tabular-nums leading-tight break-all">{value}</p>
      {sub && <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-1 leading-snug">{sub}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block h-full hover:border-fun-pink">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function FinancePage({ data }: Props) {
  const agingMax = Math.max(1, ...data.aging.map((b) => b.amount));
  const clientMax = Math.max(1, ...data.clients.map((c) => Math.max(c.outstanding, c.collectedYear)));
  const u = data.utilisation.thisMonth;
  const prev = data.utilisation.lastMonth;

  return (
    <AdminShell
      title="Finance"
      wide
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/expenses" className="rounded-full border border-fun-gray-darker px-4 py-2 text-sm hover:border-fun-pink">
            Expenses
          </Link>
          <Link href="/admin/reports" className="rounded-full border border-fun-gray-darker px-4 py-2 text-sm hover:border-fun-pink">
            Reports
          </Link>
          <a
            href="/api/admin/exports/invoices"
            className="rounded-full border border-fun-gray-darker px-4 py-2 text-sm hover:border-fun-pink"
          >
            Export invoices CSV
          </a>
        </div>
      }
    >
      <MotionSection className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MotionItem>
          <Stat
            label={`Collected · ${data.monthLabel}`}
            value={money(data.collectedThisMonth.buckets, data.collectedThisMonth)}
            sub={`${data.collectedThisMonth.count} paid invoice${data.collectedThisMonth.count === 1 ? "" : "s"}`}
          />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Outstanding"
            value={money(data.outstanding.buckets, data.outstanding)}
            sub={`${data.outstanding.count} awaiting payment`}
            href="/admin/invoices?filter=SENT"
          />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Overdue"
            value={money(data.overdue.buckets, data.overdue)}
            sub={`${data.overdue.count} past due`}
            href="/admin/invoices?filter=overdue"
          />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Drafts"
            value={money(data.drafts.buckets, data.drafts)}
            sub={`${data.drafts.count} ready to send`}
            href="/admin/invoices?filter=DRAFT"
          />
        </MotionItem>
      </MotionSection>

      <MotionSection className="mt-3 grid gap-3 sm:gap-4 grid-cols-2">
        <MotionItem>
          <Stat
            label={`Spent · ${data.monthLabel}`}
            value={money(data.spentThisMonth.buckets, data.spentThisMonth)}
            sub={`${data.spentThisMonth.count} expense${data.spentThisMonth.count === 1 ? "" : "s"}`}
            href="/admin/expenses"
          />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Net this month"
            value={formatMoney(data.netThisMonth.amount, data.netThisMonth.currency)}
            sub="Collected minus expenses"
          />
        </MotionItem>
      </MotionSection>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="font-bold">Cash · last 12 months</h2>
            <span className="flex gap-3 text-xs text-fun-gray-medium">
              <span><span className="inline-block h-2 w-2 rounded-sm bg-fun-pink mr-1" />Collected</span>
              <span><span className="inline-block h-2 w-2 rounded-sm bg-fun-gray-medium/50 mr-1" />Spent</span>
            </span>
          </div>
          <BarChart
            floor={1}
            formatValue={(n) => formatMoney(n, data.currency)}
            bars={data.monthBars.map((b) => ({
              label: b.label,
              title: b.title,
              primary: b.collected,
              secondary: b.spent,
              highlight: b.highlight,
            }))}
          />
        </Card>
        <Card>
          <h2 className="font-bold mb-4">Billable mix</h2>
          <p className="text-3xl font-bold font-monospace tabular-nums">{u.percent}%</p>
          <p className="text-sm text-fun-gray-medium mt-1">
            {formatMinutes(u.billable)} billable of {formatMinutes(u.total)} this month
          </p>
          <div className="mt-4 h-2 rounded-full bg-fun-gray-darker overflow-hidden">
            <div className="h-full bg-fun-pink" style={{ width: `${u.percent}%` }} />
          </div>
          <p className="text-xs text-fun-gray-medium mt-4">
            {data.utilisation.lastMonthLabel}: {prev.percent}% · {formatMinutes(prev.billable)}
          </p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">Receivables aging</h2>
        <Card>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.aging.map((bucket) => (
              <li key={bucket.id}>
                <p className="text-xs uppercase tracking-wider text-fun-gray-light">{bucket.label}</p>
                <p className="font-monospace text-lg font-bold mt-1">{formatMoney(bucket.amount, data.currency)}</p>
                <p className="text-xs text-fun-gray-medium">{bucket.count} invoice{bucket.count === 1 ? "" : "s"}</p>
                <div className="mt-2 h-1.5 rounded-full bg-fun-gray-darker">
                  <div className="h-full rounded-full bg-fun-pink" style={{ width: `${(bucket.amount / agingMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-bold mb-4">By client this year</h2>
          <Card>
            {data.clients.length === 0 ? (
              <p className="text-sm text-fun-gray-medium">No billed work yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.clients.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <Link href={`/admin/clients/${c.id}`} className="truncate font-bold hover:text-fun-pink">
                        {c.name}
                      </Link>
                      <span className="font-monospace text-xs shrink-0">
                        {c.outstanding > 0 ? (
                          <span className="text-yellow-300">{formatMoney(c.outstanding, c.currency)} open</span>
                        ) : (
                          <span className="text-fun-gray-medium">Clear</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-fun-gray-darker overflow-hidden flex">
                      <div
                        className="h-full bg-fun-pink"
                        style={{ width: `${(c.collectedYear / clientMax) * 100}%` }}
                        title={`Collected ${formatMoney(c.collectedYear, c.currency)}`}
                      />
                    </div>
                    <p className="text-[11px] text-fun-gray-medium mt-1">
                      Collected {formatMoney(c.collectedYear, c.currency)}
                      {c.overdue > 0 ? ` · ${formatMoney(c.overdue, c.currency)} overdue` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Overdue</h2>
            <Link href="/admin/invoices?filter=overdue" className="text-sm text-fun-pink hover:underline">
              All invoices
            </Link>
          </div>
          <Card>
            {data.overdueInvoices.length === 0 ? (
              <p className="text-sm text-fun-gray-medium">Nothing overdue. Nice.</p>
            ) : (
              <ul className="divide-y divide-fun-gray-darker">
                {data.overdueInvoices.map((inv) => {
                  const due = dueLabel(inv.dueAt, inv.status);
                  return (
                    <li key={inv.id} className="py-2.5">
                      <Link href={`/admin/invoices/${inv.id}`} className="flex items-start justify-between gap-3 text-sm hover:text-fun-pink">
                        <span className="min-w-0">
                          <span className="font-bold">{inv.number}</span>
                          <span className="text-fun-gray-medium"> · {inv.client.name}</span>
                          {due && <span className="block text-xs text-red-300 mt-0.5">{due.text}</span>}
                        </span>
                        <span className="font-monospace text-xs shrink-0">{formatMoney(inv.total, inv.currency)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">Recently paid</h2>
        <Card>
          {data.recentPaid.length === 0 ? (
            <p className="text-sm text-fun-gray-medium">No payments recorded yet.</p>
          ) : (
            <ul className="divide-y divide-fun-gray-darker">
              {data.recentPaid.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-fun-gray-medium">
                    {new Date(inv.paidAt ?? inv.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <Link href={`/admin/invoices/${inv.id}`} className="flex-1 min-w-0 hover:text-fun-pink">
                    <span className="font-bold">{inv.number}</span>
                    <span className="text-fun-gray-medium"> · {inv.client.name}</span>
                  </Link>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${invoiceStatusTone(inv.status)}`}>
                    Paid
                  </span>
                  <span className="font-monospace text-xs shrink-0">{formatMoney(inv.total, inv.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent expenses</h2>
          <Link href="/admin/expenses" className="text-sm text-fun-pink hover:underline">
            All expenses
          </Link>
        </div>
        <Card>
          {data.recentExpenses.length === 0 ? (
            <p className="text-sm text-fun-gray-medium">
              Nothing logged. <Link href="/admin/expenses" className="text-fun-pink">Add software, hosting, or contractors</Link> to see net profit.
            </p>
          ) : (
            <ul className="divide-y divide-fun-gray-darker">
              {data.recentExpenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-fun-gray-medium">
                    {new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                  </span>
                  <span className="flex-1 min-w-0 truncate">
                    <span className="font-bold">{e.vendor}</span>
                    {e.client && <span className="text-fun-gray-medium"> · {e.client.name}</span>}
                  </span>
                  <span className="font-monospace text-xs shrink-0">{formatMoney(e.amount, e.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </AdminShell>
  );
}
