import { formatMinutes } from "@/lib/billing";
import type { AllowanceUsage } from "@/lib/usage";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export const paceTone: Record<string, string> = {
  over: "text-red-300 bg-red-500/10",
  "on-track": "text-fun-pink-light bg-fun-pink-dark/60",
  under: "text-yellow-300 bg-yellow-500/10",
  "no-allowance": "text-fun-gray-light bg-fun-gray-darker",
};

export function paceText(a: AllowanceUsage, audience: "admin" | "client" = "admin") {
  const projected = formatMinutes(a.pace.projectedMinutes);
  if (a.availableMinutes == null) return `Pay as you go · on course for ~${projected}`;
  const of = formatMinutes(a.availableMinutes);
  if (a.overageMinutes > 0) return `${formatMinutes(a.overageMinutes)} over the allowance`;
  if (a.pace.status === "over") {
    const day = a.pace.runOutDate ? ` around the ${ordinal(new Date(a.pace.runOutDate).getUTCDate())}` : "";
    return audience === "client"
      ? `At the current rate you'll use about ${projected} of ${of}, so hours run out${day}`
      : `Ahead of pace — runs out${day}`;
  }
  if (a.pace.status === "under") {
    return audience === "client" ? `At the current rate you'll use about ${projected} of ${of}` : `Under-used — on course for ${projected} of ${of}`;
  }
  return audience === "client" ? `On track: about ${projected} of ${of} by the end of the period` : `On track — ${projected} of ${of}`;
}
