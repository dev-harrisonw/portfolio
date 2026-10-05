import { formatMoney } from "@/lib/billing";
import type { BuildProgress as Build } from "@/lib/usage";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;

const stageTone: Record<string, string> = {
  PENDING: "text-fun-gray-medium",
  DUE: "text-yellow-300",
  INVOICED: "text-yellow-300",
  PAID: "text-fun-pink-light",
};
const stageLabel: Record<string, string> = { PENDING: "Upcoming", DUE: "Due", INVOICED: "Invoiced", PAID: "Paid" };

export default function BuildProgress({ builds, currency }: { builds: Build[]; currency: string }) {
  if (builds.length === 0) return null;
  return (
    <MotionSection className="grid gap-4 md:grid-cols-2 mb-10">
      {builds.map((b) => {
        const due = b.dueDate ? new Date(b.dueDate) : null;
        const daysToDue = due ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null;
        return (
          <MotionItem key={b.id} className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-fun-pink">Project build</p>
                <p className="text-lg font-bold">{b.name}</p>
              </div>
              {b.status === "PAUSED" && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">Paused</span>}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-bold font-monospace">{b.progress.percent}%</p>
              <p className="text-xs text-fun-gray-medium text-right">
                {b.progress.total > 0 && `${b.progress.done} of ${b.progress.total} tasks done`}
                {daysToDue != null && (
                  <span className={`block ${daysToDue < 0 ? "text-red-300" : ""}`}>
                    {daysToDue < 0 ? `Target date passed (${fmt(b.dueDate)})` : `Target ${fmt(b.dueDate)} · ${daysToDue} days`}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-fun-gray-darker overflow-hidden">
              <div className="h-full rounded-full bg-fun-pink transition-[width] duration-700" style={{ width: `${b.progress.percent}%` }} />
            </div>

            {b.upcomingTasks.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-fun-gray-light mb-2">Up next</p>
                <ul className="space-y-1 text-sm">
                  {b.upcomingTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${t.status === "IN_PROGRESS" ? "bg-yellow-300" : "bg-fun-gray-medium"}`} />
                      {t.title}
                      {t.status === "IN_PROGRESS" && <span className="text-xs text-fun-gray-medium">in progress</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {b.stages.length > 0 && b.fixedPrice != null && (
              <div className="mt-4 border-t border-fun-gray-darker pt-3">
                <p className="text-xs uppercase tracking-wider text-fun-gray-light mb-2">
                  Payments · {formatMoney(b.fixedPrice, currency)} total
                </p>
                <ul className="space-y-1 text-sm">
                  {b.stages.map((s) => (
                    <li key={s.id} className="flex justify-between gap-3">
                      <span>
                        {s.label} <span className="text-fun-gray-medium">({s.percent}%)</span>
                      </span>
                      <span className="flex gap-3">
                        <span className="font-monospace">{formatMoney(s.amount, currency)}</span>
                        <span className={`w-16 text-right text-xs self-center ${stageTone[s.status]}`}>{stageLabel[s.status]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </MotionItem>
        );
      })}
    </MotionSection>
  );
}
