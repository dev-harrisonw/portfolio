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
    <MotionSection className="grid gap-3 sm:gap-4 md:grid-cols-2 mb-8 sm:mb-10">
      {builds.map((b) => {
        const due = b.dueDate ? new Date(b.dueDate) : null;
        const daysToDue = due ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null;
        return (
          <MotionItem key={b.id} className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 sm:p-5 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-pink">Project build</p>
                <p className="text-lg font-bold leading-snug">{b.name}</p>
              </div>
              {b.status === "PAUSED" && (
                <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-300 shrink-0">Paused</span>
              )}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl sm:text-4xl font-bold font-monospace tabular-nums leading-none">{b.progress.percent}%</p>
              <p className="text-xs text-fun-gray-medium text-right leading-relaxed">
                {b.progress.total > 0 && <span className="block">{b.progress.done} of {b.progress.total} tasks done</span>}
                {daysToDue != null && (
                  <span className={`block ${daysToDue < 0 ? "text-red-300" : ""}`}>
                    {daysToDue < 0 ? `Target passed · ${fmt(b.dueDate)}` : `Target ${fmt(b.dueDate)} · ${daysToDue}d`}
                  </span>
                )}
              </p>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-fun-gray-darker overflow-hidden">
              <div className="h-full rounded-full bg-fun-pink transition-[width] duration-700" style={{ width: `${Math.min(100, b.progress.percent)}%` }} />
            </div>

            {b.upcomingTasks.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light mb-2">Up next</p>
                <ul className="space-y-1.5 text-sm">
                  {b.upcomingTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.status === "IN_PROGRESS" ? "bg-yellow-300" : "bg-fun-gray-medium"}`} />
                      <span className="truncate">{t.title}</span>
                      {t.status === "IN_PROGRESS" && <span className="text-xs text-fun-gray-medium shrink-0">in progress</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {b.stages.length > 0 && b.fixedPrice != null && (
              <div className="mt-4 border-t border-fun-gray-darker pt-3">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light mb-2">
                  Payments · {formatMoney(b.fixedPrice, currency)} total
                </p>
                <ul className="space-y-2 text-sm">
                  {b.stages.map((s) => (
                    <li key={s.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 items-baseline">
                      <span className="min-w-0 truncate">
                        {s.label}
                        <span className="text-fun-gray-medium"> · {s.percent}%</span>
                      </span>
                      <span className="font-monospace tabular-nums">{formatMoney(s.amount, currency)}</span>
                      <span className={`col-start-2 text-[11px] text-right ${stageTone[s.status]}`}>{stageLabel[s.status]}</span>
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
