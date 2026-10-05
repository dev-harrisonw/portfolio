import Link from "next/link";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { ClientCard } from "@/lib/dashboard";
import { paceText, paceTone } from "@/components/dashboard/pace";

export default function ClientUsageCard({ card }: { card: ClientCard }) {
  const a = card.allowance;
  const pct = a.availableMinutes ? Math.min(100, (a.usedMinutes / a.availableMinutes) * 100) : 0;
  const elapsedPct = Math.min(100, (card.days.elapsed / card.days.total) * 100);

  return (
    <Link
      href={`/admin/clients/${card.id}`}
      className="block rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 sm:p-5 hover:border-fun-pink transition-colors min-w-0 h-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold truncate">{card.name}</p>
          {card.hasTime && <p className="text-xs text-fun-gray-medium">{card.days.left} days left in period</p>}
        </div>
        {card.hasTime && (
          <span className={`rounded-full px-2 py-0.5 text-xs whitespace-nowrap shrink-0 ${paceTone[a.overageMinutes > 0 ? "over" : a.pace.status]}`}>
            {a.availableMinutes == null ? "PAYG" : a.overageMinutes > 0 ? "Over" : a.pace.status.replace("-", " ")}
          </span>
        )}
      </div>

      {card.hasTime && (
        <>
          <p className="mt-4 text-xl sm:text-2xl font-bold tabular-nums">
            {formatMinutes(a.usedMinutes)}
            {a.availableMinutes != null && (
              <span className="text-sm font-normal text-fun-gray-medium"> / {formatMinutes(a.availableMinutes)}</span>
            )}
          </p>

          {a.availableMinutes != null && (
            <div className="relative mt-2 h-2 rounded-full bg-fun-gray-darker overflow-hidden">
              <div className={`h-full rounded-full ${a.overageMinutes > 0 ? "bg-red-400" : "bg-fun-pink"}`} style={{ width: `${pct}%` }} />
              <div className="absolute top-0 h-full w-px bg-white/70" style={{ left: `${elapsedPct}%` }} title="Time elapsed in period" />
            </div>
          )}

          <p className="mt-3 text-xs text-fun-gray-light leading-relaxed">{paceText(a)}</p>

          {card.extraAllowances.map((x) => (
            <p key={x.projectId} className="mt-1 text-xs text-fun-gray-medium">
              {x.label}: {formatMinutes(x.usedMinutes)} / {formatMinutes(x.availableMinutes ?? 0)}
              {x.overageMinutes > 0 && <span className="text-red-300"> (+{formatMinutes(x.overageMinutes)})</span>}
            </p>
          ))}
        </>
      )}

      {card.builds.map((b) => {
        const due = b.stages.filter((s) => s.status === "DUE").length;
        const effectiveRate = b.fixedPrice && b.internalMinutes ? Math.round((b.fixedPrice / b.internalMinutes) * 60) : null;
        return (
          <div key={b.id} className={card.hasTime || card.builds[0].id !== b.id ? "mt-4 border-t border-fun-gray-darker pt-3" : "mt-4"}>
            <div className="flex justify-between gap-2 text-sm">
              <span className="truncate min-w-0">{b.name}</span>
              <span className="font-monospace shrink-0">{b.progress.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-fun-gray-darker overflow-hidden">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(100, b.progress.percent)}%` }} />
            </div>
            <p className="mt-1 text-xs text-fun-gray-medium leading-relaxed">
              {b.dueDate && `Due ${new Date(b.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · `}
              {formatMinutes(b.internalMinutes)} logged
              {effectiveRate != null && ` · ${formatMoney(effectiveRate, card.currency)}/h effective`}
              {due > 0 && <span className="text-yellow-300"> · {due} stage{due > 1 ? "s" : ""} due</span>}
            </p>
          </div>
        );
      })}

      {card.hasTime && (
        <div className="mt-4 flex justify-between gap-2 border-t border-fun-gray-darker pt-3 text-xs">
          <span className="text-fun-gray-medium">
            So far <span className="text-white font-monospace">{formatMoney(card.soFar, card.currency)}</span>
          </span>
          <span className="text-fun-gray-medium text-right">
            Projected <span className="text-white font-monospace">{formatMoney(card.projected, card.currency)}</span>
          </span>
        </div>
      )}
    </Link>
  );
}
