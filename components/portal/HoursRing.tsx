import { useReducedMotion } from "framer-motion";
import { formatMinutes } from "@/lib/billing";

type Props = { used: number; available: number | null };

export default function HoursRing({ used, available }: Props) {
  const reduce = useReducedMotion();
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = available ? used / available : 0;
  const pct = Math.min(1, ratio);
  const over = ratio > 1;
  const color = over ? "#fb7185" : ratio > 0.8 ? "#facc15" : "#3BB143";
  const headline = formatMinutes(available != null && !over ? available - used : used);
  const [hours, mins] = headline.split(" ");
  const showMins = mins && mins !== "00m";

  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#2a2a2c" strokeWidth={stroke} fill="none" />
        {available != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{ transition: reduce ? undefined : "stroke-dashoffset 1s ease-out" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-monospace leading-none tabular-nums">{hours}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light mt-1">
          {showMins ? `${mins} · ` : ""}
          {available == null ? "logged" : over ? "over" : "left"}
        </span>
        {available != null && <span className="text-[10px] sm:text-xs text-fun-gray-medium mt-0.5">of {formatMinutes(available)}</span>}
      </div>
    </div>
  );
}
