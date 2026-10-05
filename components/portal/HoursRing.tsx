import { useReducedMotion } from "framer-motion";
import { formatMinutes } from "@/lib/billing";

type Props = { used: number; available: number | null; size?: number };

export default function HoursRing({ used, available, size = 200 }: Props) {
  const reduce = useReducedMotion();
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = available ? used / available : 0;
  const pct = Math.min(1, ratio);
  const over = ratio > 1;
  const color = over ? "#fb7185" : ratio > 0.8 ? "#facc15" : "#3BB143";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold font-monospace">{formatMinutes(available != null && !over ? available - used : used)}</span>
        <span className="text-xs uppercase tracking-wider text-fun-gray-light mt-1">
          {available == null ? "logged" : over ? "used (over)" : "remaining"}
        </span>
        {available != null && <span className="text-xs text-fun-gray-medium mt-1">of {formatMinutes(available)}</span>}
      </div>
    </div>
  );
}
