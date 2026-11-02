import Link from "next/link";
import { useRouter } from "next/router";

export type PeriodOption = { value: string; label: string; range: string };

type Props = {
  periods: PeriodOption[];
  current: string;
  isCurrent: boolean;
  days: { total: number; elapsed: number; left: number };
  exportsQuery: Record<string, string> | null;
};

function Arrow({ dir, value }: { dir: "prev" | "next"; value: string | null }) {
  const router = useRouter();
  const label = dir === "prev" ? "Previous period" : "Next period";
  const icon = (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d={dir === "prev" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const base = "h-9 w-9 shrink-0 rounded-md border flex items-center justify-center";
  if (!value) {
    return (
      <span className={`${base} border-[color:var(--dd-border)] text-fun-gray-darker cursor-not-allowed`} aria-hidden>
        {icon}
      </span>
    );
  }
  return (
    <Link
      href={{ pathname: "/portal", query: { ...router.query, period: value } }}
      aria-label={label}
      title={label}
      className={`${base} border-[color:var(--dd-border)] text-fun-gray-light hover:text-white hover:bg-[color:var(--dd-raised)]`}
    >
      {icon}
    </Link>
  );
}

export default function PeriodHeader({ periods, current, isCurrent, days, exportsQuery }: Props) {
  const router = useRouter();
  const index = periods.findIndex((p) => p.value === current);
  const period = periods[index] ?? periods[0];
  const older = periods[index + 1]?.value ?? null;
  const newer = index > 0 ? periods[index - 1].value : null;
  const pct = Math.round((days.elapsed / days.total) * 100);

  return (
    <div className="dd-panel p-4 sm:p-5 mb-6 sm:mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex items-center gap-3 min-w-0">
        <Arrow dir="prev" value={older} />
        <div className="min-w-0 flex-1 text-center lg:text-left">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight truncate">{period.label}</h1>
          <p className="text-xs text-fun-gray-medium mt-0.5">
            {period.range}
            {isCurrent ? " · current period" : " · closed"}
          </p>
        </div>
        <Arrow dir="next" value={newer} />
      </div>

      {isCurrent && (
        <div className="lg:w-56 lg:ml-6">
          <div className="flex justify-between text-xs text-fun-gray-light">
            <span>
              Day {days.elapsed} of {days.total}
            </span>
            <span className="font-semibold text-white">{days.left} days left</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-fun-gray-darker overflow-hidden">
            <div className="h-full rounded-full bg-[color:var(--dd-accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        <select
          aria-label="Jump to billing period"
          className="dd-input flex-1 sm:flex-none px-3 py-2 text-base sm:text-sm min-h-[40px]"
          value={current}
          onChange={(e) => router.push({ pathname: "/portal", query: { ...router.query, period: e.target.value } })}
        >
          {periods.map((p, i) => (
            <option key={p.value} value={p.value}>
              {p.label}
              {i === 0 ? " (current)" : ""}
            </option>
          ))}
        </select>
        {exportsQuery &&
          (["pdf", "csv"] as const).map((format) => (
            <a
              key={format}
              href={`/api/portal/timesheet?${new URLSearchParams({ ...exportsQuery, format })}`}
              className="rounded-md border border-[color:var(--dd-border)] px-3 py-2 text-sm min-h-[40px] flex items-center gap-1.5 text-fun-gray-light hover:text-white hover:bg-[color:var(--dd-raised)]"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {format === "pdf" ? "Timesheet" : "CSV"}
            </a>
          ))}
      </div>
    </div>
  );
}
