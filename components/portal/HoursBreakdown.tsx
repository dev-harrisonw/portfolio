import { formatMinutes } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";

const card = "rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-5";
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
                      <span className="text-red-300">{formatMinutes(a.overageMinutes)} over the allowance (billed at the hourly rate)</span>
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
      <ul className="space-y-5">
        {usage.byProject.map((project) => (
          <li key={project.projectId}>
            <div className="flex items-center justify-between">
              <p className="font-bold">{project.name}</p>
              <p className="font-mono text-sm">{formatMinutes(project.minutes)}</p>
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
                  <span className="font-mono text-xs">{formatMinutes(task.minutes)}</span>
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
  return (
    <div className={card}>
      {usage.completedTasks.length === 0 ? (
        <p className="text-fun-gray-light text-sm">Nothing marked complete in this period yet.</p>
      ) : (
        <ul className="space-y-2">
          {usage.completedTasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 text-fun-pink">✓</span>
              <span className="flex-1">
                {task.title}
                <span className="block text-xs text-fun-gray-medium">{task.projectName}</span>
              </span>
              <span className="text-xs text-fun-gray-medium">{fmtDate(task.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EntryLog({ usage }: { usage: ClientUsage }) {
  if (usage.entries.length === 0) return null;
  return (
    <div className={`${card} overflow-x-auto`}>
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-fun-gray-medium">
          <tr>
            <th className="pb-2 pr-4">Date</th>
            <th className="pb-2 pr-4">Work</th>
            <th className="pb-2 text-right">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-fun-gray-darker">
          {[...usage.entries].reverse().map((e) => (
            <tr key={e.id}>
              <td className="py-2 pr-4 whitespace-nowrap text-fun-gray-light">{fmtDate(e.startedAt, { weekday: "short", day: "numeric", month: "short" })}</td>
              <td className="py-2 pr-4">
                <span className="font-bold">{e.taskTitle}</span>
                <span className="text-fun-gray-medium"> · {e.projectName}</span>
                {e.note && <span className="block text-fun-gray-light">{e.note}</span>}
              </td>
              <td className="py-2 text-right font-mono whitespace-nowrap">
                {formatMinutes(e.durationMinutes)}
                {!e.billable && <span className="block text-xs text-fun-gray-medium font-sans">not billed</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
