import { useState } from "react";
import { Button, Field, fromMinor, Input, Select, toInt, toMinor } from "@/components/admin/Form";

export type ClientFormValues = {
  name: string;
  billingEmail: string;
  currency: string;
  hourlyRate: number;
  monthlyHours: number | null;
  retainerAmount: number | null;
  periodStartDay: number;
  rolloverPolicy: "EXPIRE" | "ROLLOVER" | "ROLLOVER_CAPPED";
  rolloverCapHours: number | null;
  roundingMinutes: number;
  vatRateBps: number;
  reviewBeforeSend: boolean;
};

type Props = {
  initial?: Partial<ClientFormValues>;
  submitLabel: string;
  onSubmit: (values: ClientFormValues) => Promise<void>;
};

export default function ClientForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [billingEmail, setBillingEmail] = useState(initial?.billingEmail ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "GBP");
  const [hourlyRate, setHourlyRate] = useState(fromMinor(initial?.hourlyRate));
  const [monthlyHours, setMonthlyHours] = useState(initial?.monthlyHours?.toString() ?? "");
  const [retainerAmount, setRetainerAmount] = useState(fromMinor(initial?.retainerAmount));
  const [periodStartDay, setPeriodStartDay] = useState((initial?.periodStartDay ?? 1).toString());
  const [rolloverPolicy, setRolloverPolicy] = useState<ClientFormValues["rolloverPolicy"]>(initial?.rolloverPolicy ?? "EXPIRE");
  const [rolloverCapHours, setRolloverCapHours] = useState(initial?.rolloverCapHours?.toString() ?? "");
  const [roundingMinutes, setRoundingMinutes] = useState((initial?.roundingMinutes ?? 0).toString());
  const [vatPercent, setVatPercent] = useState(((initial?.vatRateBps ?? 0) / 100).toString());
  const [reviewBeforeSend, setReviewBeforeSend] = useState(initial?.reviewBeforeSend ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isRetainer = monthlyHours.trim() !== "";

  const submit = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSubmit({
        name,
        billingEmail,
        currency,
        hourlyRate: toMinor(hourlyRate) ?? 0,
        monthlyHours: toInt(monthlyHours),
        retainerAmount: isRetainer ? toMinor(retainerAmount) : null,
        periodStartDay: toInt(periodStartDay) ?? 1,
        rolloverPolicy,
        rolloverCapHours: rolloverPolicy === "ROLLOVER_CAPPED" ? toInt(rolloverCapHours) : null,
        roundingMinutes: toInt(roundingMinutes) ?? 0,
        vatRateBps: Math.round((parseFloat(vatPercent) || 0) * 100),
        reviewBeforeSend,
      });
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Ltd" />
        </Field>
        <Field label="Billing email" hint="Invoices and monthly summaries go here">
          <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="accounts@acme.com" />
        </Field>
        <Field label="Hourly rate">
          <Input inputMode="decimal" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="65.00" />
        </Field>
        <Field label="Currency">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </Select>
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3 border-t border-fun-gray-darker pt-6">
        <legend className="text-sm font-bold mb-2">Retainer</legend>
        <Field label="Hours per period" hint="Leave blank for pay-as-you-go">
          <Input inputMode="numeric" value={monthlyHours} onChange={(e) => setMonthlyHours(e.target.value)} placeholder="40" />
        </Field>
        <Field label="Retainer fee" hint="Blank = hours × rate">
          <Input inputMode="decimal" value={retainerAmount} onChange={(e) => setRetainerAmount(e.target.value)} disabled={!isRetainer} placeholder="2400.00" />
        </Field>
        <Field label="Period starts on day" hint="1 = calendar month">
          <Input inputMode="numeric" value={periodStartDay} onChange={(e) => setPeriodStartDay(e.target.value)} />
        </Field>
        <Field label="Unused hours">
          <Select value={rolloverPolicy} onChange={(e) => setRolloverPolicy(e.target.value as ClientFormValues["rolloverPolicy"])} disabled={!isRetainer}>
            <option value="EXPIRE">Expire at period end</option>
            <option value="ROLLOVER">Roll over</option>
            <option value="ROLLOVER_CAPPED">Roll over (capped)</option>
          </Select>
        </Field>
        <Field label="Rollover cap (hours)">
          <Input
            inputMode="numeric"
            value={rolloverCapHours}
            onChange={(e) => setRolloverCapHours(e.target.value)}
            disabled={!isRetainer || rolloverPolicy !== "ROLLOVER_CAPPED"}
            placeholder="10"
          />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3 border-t border-fun-gray-darker pt-6">
        <legend className="text-sm font-bold mb-2">Invoicing</legend>
        <Field label="Round entries up to">
          <Select value={roundingMinutes} onChange={(e) => setRoundingMinutes(e.target.value)}>
            <option value="0">Exact minutes</option>
            <option value="6">6 minutes</option>
            <option value="15">15 minutes</option>
          </Select>
        </Field>
        <Field label="VAT %" hint="0 until VAT-registered">
          <Input inputMode="decimal" value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-fun-gray-light self-center mt-4">
          <input type="checkbox" checked={reviewBeforeSend} onChange={(e) => setReviewBeforeSend(e.target.checked)} />
          Review invoices before sending
        </label>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={saving || !name || !billingEmail}>
          {saving ? "Saving…" : submitLabel}
        </Button>
        {saved && <span className="text-sm text-fun-pink">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
