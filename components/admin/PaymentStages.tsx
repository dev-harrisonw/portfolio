import { useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import { PAYMENT_TERMS } from "@/lib/projects";
import { Button, Input, Select } from "@/components/admin/Form";
import type { StageRow } from "@/components/admin/ProjectPanel";

type TermsKey = keyof typeof PAYMENT_TERMS;

type Props = {
  projectId: string;
  price: number | null;
  currency: string;
  terms: TermsKey | null;
  stages: StageRow[];
  amounts: number[];
  onChange: () => void;
};

const statusTone: Record<StageRow["status"], string> = {
  PENDING: "text-fun-gray-medium",
  DUE: "text-yellow-300",
  INVOICED: "text-yellow-300",
  PAID: "text-fun-pink-light",
};

export default function PaymentStages({ projectId, price, currency, terms, stages, amounts, onChange }: Props) {
  const locked = stages.some((s) => s.status !== "PENDING");
  const [choice, setChoice] = useState<TermsKey>(terms ?? "FIFTY_FIFTY");
  const [custom, setCustom] = useState(
    terms === "CUSTOM" ? stages.map((s) => ({ label: s.label, percent: String(s.percent) })) : [{ label: "Deposit", percent: "50" }, { label: "Completion", percent: "50" }]
  );
  const [editing, setEditing] = useState(stages.length === 0);
  const [error, setError] = useState<string | null>(null);

  const customTotal = custom.reduce((s, x) => s + (parseInt(x.percent, 10) || 0), 0);

  const apply = async () => {
    setError(null);
    try {
      await api(`/api/admin/projects/${projectId}/stages`, {
        method: "PUT",
        body: {
          terms: choice,
          ...(choice === "CUSTOM" ? { stages: custom.map((s) => ({ label: s.label, percent: parseInt(s.percent, 10) || 0 })) } : {}),
        },
      });
      setEditing(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const setStage = async (id: string, status: "DUE" | "PENDING") => {
    setError(null);
    try {
      await api(`/api/admin/stages/${id}`, { method: "PUT", body: { status } });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-fun-gray-darker p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">
          Payment terms
          {terms && !editing && <span className="font-normal text-fun-gray-medium"> · {PAYMENT_TERMS[terms].label}</span>}
        </p>
        {!editing && !locked && (
          <button type="button" className="text-xs text-fun-pink hover:underline" onClick={() => setEditing(true)}>
            Change
          </button>
        )}
      </div>

      {price == null && <p className="mt-2 text-xs text-yellow-300">Set a fixed price in Settings to see stage amounts.</p>}

      {editing ? (
        <div className="mt-3 space-y-3">
          <Select value={choice} onChange={(e) => setChoice(e.target.value as TermsKey)}>
            {(Object.keys(PAYMENT_TERMS) as TermsKey[]).map((key) => (
              <option key={key} value={key}>
                {PAYMENT_TERMS[key].label}
              </option>
            ))}
          </Select>
          {choice === "CUSTOM" && (
            <div className="space-y-2">
              {custom.map((stage, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={stage.label}
                    onChange={(e) => setCustom((rows) => rows.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
                    placeholder="Stage name"
                  />
                  <Input
                    inputMode="numeric"
                    value={stage.percent}
                    onChange={(e) => setCustom((rows) => rows.map((r, j) => (j === i ? { ...r, percent: e.target.value } : r)))}
                    className="w-20"
                    aria-label="Percent"
                  />
                  <span className="self-center text-sm text-fun-gray-medium">%</span>
                  <button
                    type="button"
                    className="text-xs text-fun-gray-medium hover:text-red-300"
                    onClick={() => setCustom((rows) => rows.filter((_, j) => j !== i))}
                    disabled={custom.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs">
                <button type="button" className="text-fun-pink hover:underline" onClick={() => setCustom((rows) => [...rows, { label: "", percent: "" }])}>
                  + Add stage
                </button>
                <span className={customTotal === 100 ? "text-fun-gray-medium" : "text-red-300"}>Total {customTotal}%</span>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={apply} disabled={choice === "CUSTOM" && customTotal !== 100}>
              Apply terms
            </Button>
            {stages.length > 0 && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-fun-gray-darker">
          {stages.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1">
                {s.label} <span className="text-fun-gray-medium">({s.percent}%)</span>
              </span>
              {price != null && <span className="font-monospace">{formatMoney(amounts[i], currency)}</span>}
              <span className={`w-20 text-right text-xs ${statusTone[s.status]}`}>{s.status.toLowerCase()}</span>
              {s.status === "PENDING" && (
                <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => setStage(s.id, "DUE")} disabled={price == null}>
                  Mark reached
                </Button>
              )}
              {s.status === "DUE" && (
                <button type="button" className="text-xs text-fun-gray-medium hover:text-white" onClick={() => setStage(s.id, "PENDING")}>
                  Undo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
