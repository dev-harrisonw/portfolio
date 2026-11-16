import { formatMinutes } from "@/lib/billing";

/** `over` is time beyond the allowance; `secondary` is non-billable time. Both stack on `primary`. */
export type Bar = { label: string; title: string; primary: number; secondary?: number; over?: number; highlight?: boolean };

/** Lightweight stacked bar chart. Defaults to minutes; pass formatValue for money. */
export default function BarChart({
  bars,
  height = 140,
  formatValue = formatMinutes,
  floor = 60,
}: {
  bars: Bar[];
  height?: number;
  formatValue?: (n: number) => string;
  floor?: number;
}) {
  const totalOf = (b: Bar) => b.primary + (b.secondary ?? 0) + (b.over ?? 0);
  const max = Math.max(floor, ...bars.map(totalOf));
  return (
    <div className="flex gap-[3px]">
      {bars.map((bar, i) => {
        const total = totalOf(bar);
        const segments = [
          { value: bar.over ?? 0, className: "bg-red-400/80" },
          { value: bar.secondary ?? 0, className: "bg-fun-gray-medium/50" },
          { value: bar.primary, className: bar.highlight ? "bg-fun-pink-light" : "bg-fun-pink" },
        ].filter((s) => s.value > 0);
        return (
          <div key={i} className="group relative min-w-0 flex-1">
            <div className="relative flex h-full flex-col justify-end" style={{ height }}>
              {segments.map((s, j) => (
                <div
                  key={j}
                  className={`w-full ${j === 0 ? "rounded-t-sm" : ""} ${s.className} transition-[height] duration-500`}
                  style={{ height: `${(s.value / max) * 100}%`, minHeight: total > 0 ? 2 : 0 }}
                />
              ))}
              {bar.highlight && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-fun-pink-light" />}
            </div>
            <div className="mt-2 text-center text-[10px] leading-tight text-fun-gray-medium">
              <span className="block group-hover:hidden">{bar.label}</span>
              <span className="hidden text-white group-hover:block">{formatValue(total)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
