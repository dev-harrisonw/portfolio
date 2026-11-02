import { formatMinutes } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";

const card = "rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-3.5 sm:p-5";
const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });

export function AllowanceSummary({ usage }: { usage: ClientUsage }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {usage.allowances
        .filter((a) => a.availableMinutes != null || a.scope === "client")
        .map((a) => {
          const pct = a.availableMinutes ? Math.min(100, Math.round((a.usedMinutes / a.availableMinutes) * 100)) : 0;
          return (
            <div key={a.projectId ?? "client"} className={card}>
              <p className="text-xs uppercase tracking-wider text-fun-gray-light">
                {a.scope === "project" ? `${a.label} allowance` : "Hours this period"}
              </p>
              {a.availableMinutes == null ? (
                <p className="text-3xl font-bold mt-2">{formatMinutes(a.usedMinutes)}</p>
              ) : (
                <>
                  <p className="text-3xl font-bold mt-2">
                    {formatMinutes(a.usedMinutes)}
                    <span className="text-base font-normal text-fun-gray-medium"> of {formatMinutes(a.availableMinutes)}</span>
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-fun-gray-darker overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.overageMinutes > 0 ? "bg-red-400" : pct > 80 ? "bg-yellow-400" : "bg-fun-pink"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-fun-gray-light">
                    {a.overageMinutes > 0 ? (
                      <span className="text-red-300">
                        {formatMinutes(a.overageMinutes)} over the allowance
                        {usage.client.billOverages ? " (billed at the hourly rate)" : " (not billed)"}
                      </span>
                    ) : (
                      <>{formatMinutes(a.remainingMinutes ?? 0)} remaining</>
                    )}
                  </p>
                  {a.carriedInMinutes > 0 && (
                    <p className="text-xs text-fun-gray-medium mt-1">Includes {formatMinutes(a.carriedInMinutes)} rolled over from last period</p>
                  )}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}

export function ProjectBreakdown({ usage }: { usage: ClientUsage }) {
  if (usage.byProject.length === 0) return <div className={`${card} text-fun-gray-light`}>No time logged in this period yet.</div>;
  return (
    <div className={card}>
      <ul className="space-y-4 sm:space-y-5">
        {usage.byProject.map((project) => (
          <li key={project.projectId}>
            <div className="flex items-center justify-between">
              <p className="font-bold">{project.name}</p>
              <p className="font-monospace text-sm">{formatMinutes(project.minutes)}</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-fun-gray-darker overflow-hidden">
              <div className="h-full bg-fun-pink" style={{ width: `${Math.round((project.minutes / usage.totals.minutes) * 100)}%` }} />
            </div>
            <ul className="mt-2 space-y-1">
              {project.tasks.map((task) => (
                <li key={task.taskId} className="flex items-center justify-between text-sm text-fun-gray-light">
                  <span className="truncate">
                    {task.status === "DONE" && <span className="text-fun-pink mr-1">✓</span>}
                    {task.title}
                  </span>
                  <span className="font-monospace text-xs">{formatMinutes(task.minutes)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompletedTasks({ usage }: { usage: ClientUsage }) {
  const completedIds = new Set(usage.completedTasks.map((t) => t.id));
  const inProgress = usage.byProject.flatMap((p) =>
    p.tasks.filter((t) => t.status !== "DONE" && !completedIds.has(t.taskId)).map((t) => ({ ...t, projectName: p.name }))
  );
  const showProject = usage.byProject.length > 1;

  return (
    <div className={card}>
      {usage.completedTasks.length === 0 ? (
        <p className="text-fun-gray-light text-sm">Nothing marked complete in this period yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {usage.completedTasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-fun-pink/20 text-fun-pink text-[10px] flex items-center justify-center">✓</span>
              <span className="flex-1 min-w-0">
                {task.title}
                {showProject && <span className="block text-xs text-fun-gray-medium">{task.projectName}</span>}
              </span>
              <span className="text-xs text-fun-gray-medium whitespace-nowrap">{fmtDate(task.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {inProgress.length > 0 && (
        <div className="mt-5 pt-4 border-t border-fun-gray-darker">
          <p className="text-[11px] uppercase tracking-wider text-fun-gray-medium mb-2.5">Still in progress</p>
          <ul className="space-y-2.5">
            {inProgress.map((task) => (
              <li key={task.taskId} className="flex items-start gap-3 text-sm">
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-yellow-400/70" />
                <span className="flex-1 min-w-0 text-fun-gray-light">
                  {task.title}
                  {showProject && <span className="block text-xs text-fun-gray-medium">{task.projectName}</span>}
                </span>
                <span className="font-monospace text-xs text-fun-gray-medium whitespace-nowrap">{formatMinutes(task.minutes)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

/** "1 – 7 Oct", or "29 Sept – 4 Oct" across months. Weeks are clipped to the end of the period. */
function weekRange(from: number, periodEnd: number) {
  const to = Math.min(from + WEEK_MS, periodEnd) - DAY_MS;
  const a = new Date(from);
  const b = new Date(to);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth();
  const first = fmtDate(a.toISOString(), sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  return to <= from ? fmtDate(a.toISOString()) : `${first} – ${fmtDate(b.toISOString())}`;
}

export function EntryLog({ usage }: { usage: ClientUsage }) {
  if (usage.entries.length === 0) return null;
  const start = new Date(usage.period.start).getTime();
  const periodEnd = new Date(usage.period.end).getTime();
  const showProject = usage.byProject.length > 1;

  const weeks = new Map<number, { from: number; minutes: number; entries: ClientUsage["entries"] }>();
  for (const e of usage.entries) {
    const index = Math.max(0, Math.floor((new Date(e.startedAt).getTime() - start) / WEEK_MS));
    const week = weeks.get(index) ?? { from: start + index * WEEK_MS, minutes: 0, entries: [] };
    week.minutes += e.durationMinutes;
    week.entries.push(e);
    weeks.set(index, week);
  }
  const groups = [...weeks.values()].sort((a, b) => b.from - a.from);

  return (
    <div className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 overflow-hidden">
      {groups.map((week, i) => (
        <details key={week.from} open={i === 0} className="group border-b border-fun-gray-darker last:border-b-0">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 sm:px-5 py-3 hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-fun-gray-medium transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M7.5 4.5 13 10l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm font-semibold">{weekRange(week.from, periodEnd)}</span>
            <span className="text-xs text-fun-gray-medium">
              {week.entries.length} {week.entries.length === 1 ? "entry" : "entries"}
            </span>
            <span className="ml-auto font-monospace text-sm">{formatMinutes(week.minutes)}</span>
          </summary>
          <ul className="divide-y divide-fun-gray-darker border-t border-fun-gray-darker">
            {[...week.entries].reverse().map((e) => (
              <li key={e.id} className="flex gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 text-sm">
                <span className="w-14 sm:w-24 shrink-0 text-xs text-fun-gray-medium pt-0.5">
                  <span className="sm:hidden">{fmtDate(e.startedAt)}</span>
                  <span className="hidden sm:inline">{fmtDate(e.startedAt, { weekday: "short", day: "numeric", month: "short" })}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{e.taskTitle}</span>
                  {showProject && <span className="text-fun-gray-medium"> · {e.projectName}</span>}
                  {e.note && <span className="block text-xs sm:text-sm text-fun-gray-light mt-0.5">{e.note}</span>}
                </span>
                <span className="shrink-0 text-right font-monospace whitespace-nowrap">
                  {formatMinutes(e.durationMinutes)}
                  {!e.billable && <span className="block text-[11px] text-fun-gray-medium font-sans">not billed</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
