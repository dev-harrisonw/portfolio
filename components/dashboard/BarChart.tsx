import { formatMinutes } from "@/lib/billing";

export type Bar = { label: string; title: string; primary: number; secondary?: number; highlight?: boolean };

/** Lightweight stacked bar chart (minutes), no chart library needed. */
export default function BarChart({ bars, height = 140 }: { bars: Bar[]; height?: number }) {
  const max = Math.max(60, ...bars.map((b) => b.primary + (b.secondary ?? 0)));
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {bars.map((bar, i) => {
          const total = bar.primary + (bar.secondary ?? 0);
          return (
            <div
              key={i}
              className="group relative flex-1 flex flex-col justify-end h-full"
              title={`${bar.title}: ${formatMinutes(total)}`}
            >
              {bar.secondary ? (
                <div className="w-full bg-fun-gray-medium/50 rounded-t-sm" style={{ height: `${(bar.secondary / max) * 100}%` }} />
              ) : null}
              <div
                className={`w-full ${bar.secondary ? "" : "rounded-t-sm"} ${
                  bar.highlight ? "bg-fun-pink-light" : "bg-fun-pink"
                } ${total === 0 ? "opacity-0" : ""} transition-[height] duration-500`}
                style={{ height: `${(bar.primary / max) * 100}%`, minHeight: total ? 2 : 0 }}
              />
              {bar.highlight && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-fun-pink-light" />}
            </div>
          );
        })}
      </div>
      <div className="flex gap-[3px] mt-2 text-[10px] text-fun-gray-medium">
        {bars.map((bar, i) => (
          <span key={i} className="flex-1 text-center">
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
}
