import { formatMinutes } from "@/lib/billing";

/** `over` is time beyond the allowance; `secondary` is non-billable time. Both stack on `primary`. */
export type Bar = {
  label: string;
  title: string;
  primary: number;
  secondary?: number;
  over?: number;
  highlight?: boolean;
  /** A bar for time that hasn't happened yet. Drawn as an empty slot. */
  future?: boolean;
};

/** Lightweight stacked bar chart. Defaults to minutes; pass formatValue for money. */
export default function BarChart({
  bars,
  height = 140,
  formatValue = formatMinutes,
  floor = 60,
  showValues = false,
  target,
  targetLabel,
}: {
  bars: Bar[];
  height?: number;
  formatValue?: (n: number) => string;
  floor?: number;
  /** Print each bar's total under its label. Touch screens can't hover, so the portal turns this on. */
  showValues?: boolean;
  /** Draws a dashed reference line at this value, e.g. the weekly share of an allowance. */
  target?: number | null;
  targetLabel?: string;
}) {
  const totalOf = (b: Bar) => b.primary + (b.secondary ?? 0) + (b.over ?? 0);
  const max = Math.max(floor, target ?? 0, ...bars.map(totalOf));
  return (
    <div className="relative">
      {target != null && target > 0 && (
        <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: height * (1 - target / max) }}>
          <div className="border-t border-dashed border-white/40" />
          {targetLabel && (
            <span className="absolute right-0 -top-4 rounded bg-[color:var(--dd-panel,#141414)] px-1 text-[10px] leading-4 text-fun-gray-light">
              {targetLabel}
            </span>
          )}
        </div>
      )}
      <div className="flex gap-[3px]">
        {bars.map((bar, i) => {
          const total = totalOf(bar);
          const segments = [
            { value: bar.over ?? 0, className: "bg-red-400/80" },
            { value: bar.secondary ?? 0, className: "bg-fun-gray-medium/50" },
            { value: bar.primary, className: bar.highlight ? "bg-fun-pink-light" : "bg-fun-pink" },
          ].filter((s) => s.value > 0);
          return (
            <div key={i} className="group relative min-w-0 flex-1" title={`${bar.title}: ${bar.future ? "upcoming" : formatValue(total)}`}>
              <div className="relative flex h-full flex-col justify-end" style={{ height }}>
                {bar.future && total === 0 ? (
                  <div className="h-full w-full rounded-sm border border-dashed border-fun-gray-darker" />
                ) : (
                  segments.map((s, j) => (
                    <div
                      key={j}
                      className={`w-full ${j === 0 ? "rounded-t-sm" : ""} ${s.className} transition-[height] duration-500`}
                      style={{ height: `${(s.value / max) * 100}%`, minHeight: total > 0 ? 2 : 0 }}
                    />
                  ))
                )}
                {bar.highlight && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-fun-pink-light" />}
              </div>
              <div className="mt-2 text-center text-[10px] leading-tight text-fun-gray-medium">
                {showValues ? (
                  <>
                    <span className={`block truncate ${bar.highlight ? "text-white" : ""}`}>{bar.label}</span>
                    <span className="mt-0.5 block truncate font-monospace text-fun-gray-light">
                      {bar.future && total === 0 ? <span className="font-sans text-fun-gray-medium">upcoming</span> : formatValue(total)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block group-hover:hidden">{bar.label}</span>
                    <span className="hidden text-white group-hover:block">{formatValue(total)}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
