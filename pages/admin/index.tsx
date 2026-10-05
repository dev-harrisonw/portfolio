import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { AdminDashboard } from "@/lib/dashboard";
import AdminShell from "@/components/admin/AdminShell";
import { Card } from "@/components/admin/Form";
import RunningTimer, { type RunningEntry } from "@/components/admin/time/RunningTimer";
import ClientUsageCard from "@/components/dashboard/ClientUsageCard";
import BarChart from "@/components/dashboard/BarChart";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

type Props = { data: AdminDashboard };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const { getAdminDashboard } = await import("@/lib/dashboard");
  const data = await getAdminDashboard();
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

export default function AdminDashboardPage({ data }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState<RunningEntry>(data.running as RunningEntry);
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const today = new Date().toISOString().slice(0, 10);
  const currency = data.cards[0]?.currency ?? "GBP";
  const maxClient = Math.max(1, ...data.byClient.map((c) => c.minutes));

  const quickStart = async (taskId: string) => {
    const { entry } = await api("/api/admin/time/timer", { body: { taskId } });
    setRunning(entry);
  };

  return (
    <AdminShell title="Dashboard" wide>
      <RunningTimer
        clients={data.pickerTree}
        running={running}
        onChange={(next) => {
          setRunning(next);
          if (!next) refresh();
        }}
      />

      {!running && data.quickStart.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-fun-gray-medium self-center">Resume:</span>
          {data.quickStart.map((t) => (
            <button
              key={t.taskId}
              type="button"
              onClick={() => quickStart(t.taskId)}
              className="rounded-full border border-fun-gray-darker px-3 py-1 text-xs hover:border-fun-pink"
              title={`${t.client} · ${t.project}`}
            >
              ▶ {t.title}
            </button>
          ))}
        </div>
      )}

      <MotionSection className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MotionItem>
          <Stat label="Billable this period" value={formatMinutes(data.totals.billableMinutes)} sub={`${formatMinutes(data.totals.nonBillableMinutes)} non-billable`} />
        </MotionItem>
        <MotionItem>
          <Stat label="Unbilled so far" value={formatMoney(data.totals.soFar, currency)} sub="Across current periods" />
        </MotionItem>
        <MotionItem>
          <Stat label="Projected invoices" value={formatMoney(data.totals.projected, currency)} sub="At the current pace" />
        </MotionItem>
        <MotionItem>
          <Stat label="Active clients" value={String(data.cards.length)} sub={`${data.cards.filter((c) => c.allowance.overageMinutes > 0 || c.allowance.pace.status === "over").length} need attention`} />
        </MotionItem>
      </MotionSection>

      {data.nudges.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4">Needs a nudge</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.nudges.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-fun-gray-darker px-4 py-3 hover:border-fun-pink transition-colors h-full"
                >
                  <span className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        n.tone === "red" ? "bg-red-500/15 text-red-300" : "bg-yellow-500/15 text-yellow-300"
                      }`}
                    >
                      {n.label}
                    </span>
                    <p className="font-bold mt-1 truncate">{n.title}</p>
                    <p className="text-xs text-fun-gray-medium mt-0.5">{n.detail}</p>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Clients this period</h2>
          <Link href="/admin/clients" className="text-sm text-fun-pink hover:underline">
            Manage clients
          </Link>
        </div>
        {data.cards.length === 0 ? (
          <Card className="text-fun-gray-light">
            No clients yet. <Link href="/admin/clients" className="text-fun-pink">Add your first client</Link> to start tracking.
          </Card>
        ) : (
          <MotionSection className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.cards.map((card) => (
              <MotionItem key={card.id}>
                <ClientUsageCard card={card} />
              </MotionItem>
            ))}
          </MotionSection>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="font-bold text-sm sm:text-base">Hours per day · {data.monthLabel}</h2>
            <span className="flex gap-3 text-xs text-fun-gray-medium">
              <span><span className="inline-block h-2 w-2 rounded-sm bg-fun-pink mr-1" />Billable</span>
              <span><span className="inline-block h-2 w-2 rounded-sm bg-fun-gray-medium/50 mr-1" />Non-billable</span>
            </span>
          </div>
          <BarChart
            bars={data.daily.map((d) => ({
              label: Number(d.date.slice(8)) % 5 === 1 ? String(Number(d.date.slice(8))) : "",
              title: d.date,
              primary: d.billable,
              secondary: d.nonBillable,
              highlight: d.date === today,
            }))}
          />
        </Card>
        <Card>
          <h2 className="font-bold mb-4">By client · {data.monthLabel}</h2>
          {data.byClient.length === 0 ? (
            <p className="text-sm text-fun-gray-medium">No time logged this month.</p>
          ) : (
            <ul className="space-y-3">
              {data.byClient.map((c) => (
                <li key={c.id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{c.name}</span>
                    <span className="font-monospace text-xs">{formatMinutes(c.minutes)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-fun-gray-darker">
                    <div className="h-full rounded-full bg-fun-pink" style={{ width: `${(c.minutes / maxClient) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent entries</h2>
          <Link href="/admin/time" className="text-sm text-fun-pink hover:underline">
            All time
          </Link>
        </div>
        <Card>
          {data.recent.length === 0 ? (
            <p className="text-sm text-fun-gray-medium">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y divide-fun-gray-darker">
              {data.recent.map((e) => (
                <li key={e.id} className="flex items-start sm:items-center gap-3 sm:gap-4 py-2.5 text-sm">
                  <span className="w-12 sm:w-20 shrink-0 text-xs text-fun-gray-medium pt-0.5 sm:pt-0">
                    {new Date(e.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="font-bold">{e.task.title}</span>
                    <span className="text-fun-gray-medium"> · {e.task.project.client.name}</span>
                    {e.note && <span className="block sm:inline text-fun-gray-light"> — {e.note}</span>}
                  </span>
                  <span className="font-monospace text-xs shrink-0">{formatMinutes(e.durationMinutes)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </AdminShell>
  );
}
