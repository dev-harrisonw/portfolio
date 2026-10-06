import Link from "next/link";
import type { GetServerSideProps } from "next";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { ReportsDashboard } from "@/lib/reports";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/admin/Form";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

type Props = { data: ReportsDashboard };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const { getReportsDashboard } = await import("@/lib/reports");
  const data = await getReportsDashboard();
  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="min-w-0 h-full">
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light leading-tight">{label}</p>
      <p className="text-lg sm:text-2xl font-bold mt-1 font-monospace tabular-nums leading-tight break-all">{value}</p>
      {sub && <p className="text-[11px] sm:text-xs text-fun-gray-medium mt-1 leading-snug">{sub}</p>}
    </Card>
  );
}

export default function ReportsPage({ data }: Props) {
  const maxAbs = Math.max(1, ...data.clients.map((c) => Math.max(c.collected, c.spent, Math.abs(c.net))));
  const catMax = Math.max(1, ...data.categories.map((c) => c.amount));

  return (
    <AdminShell
      title={`Reports · ${data.year}`}
      wide
      actions={
        <Link href="/admin/finance" className="text-sm text-fun-pink hover:underline">
          Finance
        </Link>
      }
    >
      <MotionSection className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MotionItem>
          <Stat label="Collected YTD" value={formatMoney(data.totals.collected, data.totals.currency)} />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Spent YTD"
            value={formatMoney(data.totals.spent, data.totals.currency)}
            sub={data.totals.overhead ? `${formatMoney(data.totals.overhead, data.totals.currency)} overhead` : undefined}
          />
        </MotionItem>
        <MotionItem>
          <Stat label="Net YTD" value={formatMoney(data.totals.net, data.totals.currency)} />
        </MotionItem>
        <MotionItem>
          <Stat
            label="Utilisation YTD"
            value={`${data.totals.utilisation}%`}
            sub={`${formatMinutes(data.totals.billable)} billable`}
          />
        </MotionItem>
      </MotionSection>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Client profitability</h2>
          <Card>
            {data.clients.length === 0 ? (
              <p className="text-sm text-fun-gray-medium">No billed work or time this year yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.clients.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <Link href={`/admin/clients/${c.id}`} className="truncate font-bold hover:text-fun-pink">
                        {c.name}
                      </Link>
                      <span className={`font-monospace text-xs shrink-0 ${c.net < 0 ? "text-red-300" : ""}`}>
                        {formatMoney(c.net, c.currency)} net
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-fun-gray-darker overflow-hidden flex">
                      <div className="h-full bg-fun-pink" style={{ width: `${(c.collected / maxAbs) * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-fun-gray-medium mt-1">
                      Collected {formatMoney(c.collected, c.currency)}
                      {c.spent > 0 ? ` · spent ${formatMoney(c.spent, c.currency)}` : ""}
                      {c.hours > 0 ? ` · ${formatMinutes(c.billableHours)} billable` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
        <section>
          <h2 className="text-xl font-bold mb-4">Spend by category</h2>
          <Card>
            {data.categories.length === 0 ? (
              <p className="text-sm text-fun-gray-medium">
                No expenses this year. <Link href="/admin/expenses" className="text-fun-pink">Log some</Link>.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.categories.map((c) => (
                  <li key={c.category}>
                    <div className="flex justify-between text-sm">
                      <span>{c.label}</span>
                      <span className="font-monospace text-xs">{formatMoney(c.amount, data.totals.currency)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-fun-gray-darker">
                      <div className="h-full rounded-full bg-fun-pink" style={{ width: `${(c.amount / catMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}
