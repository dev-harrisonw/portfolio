import { useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMinutes, formatMoney } from "@/lib/billing";
import { Button, Card, Input, toMinor, fromMinor } from "@/components/admin/Form";

export type InvoiceLineRow = {
  id: string;
  description: string;
  detail: string;
  minutes: number;
  rate: number;
  amount: number;
};

function canBillTime(line: InvoiceLineRow) {
  return line.minutes > 0 && line.rate > 0;
}

export default function InvoiceLines({
  invoiceId,
  currency,
  lines,
  subtotal,
  vat,
  vatRateBps,
  total,
  editable,
  onChange,
  onError,
}: {
  invoiceId: string;
  currency: string;
  lines: InvoiceLineRow[];
  subtotal: number;
  vat: number;
  vatRateBps: number;
  total: number;
  editable: boolean;
  onChange: () => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Card>
      <ul className="divide-y divide-fun-gray-darker">
        {lines.map((line) =>
          editing === line.id ? (
            <LineForm
              key={line.id}
              line={line}
              currency={currency}
              onCancel={() => setEditing(null)}
              onSave={async (body) => {
                await api(`/api/admin/invoices/${invoiceId}/lines/${line.id}`, { method: "PUT", body });
                setEditing(null);
                onChange();
              }}
              onDelete={async () => {
                await api(`/api/admin/invoices/${invoiceId}/lines/${line.id}`, { method: "DELETE" });
                setEditing(null);
                onChange();
              }}
              onError={onError}
            />
          ) : (
            <li key={line.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block">{line.description}</span>
                {line.detail && <span className="block text-xs text-fun-gray-medium mt-0.5">{line.detail}</span>}
                {line.minutes > 0 && <span className="text-fun-gray-medium"> · {formatMinutes(line.minutes)}</span>}
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="font-monospace">{formatMoney(line.amount, currency)}</span>
                {editable && (
                  <button type="button" className="text-xs text-fun-pink hover:underline" onClick={() => setEditing(line.id)}>
                    Edit
                  </button>
                )}
              </span>
            </li>
          )
        )}
      </ul>

      {editable &&
        (adding ? (
          <AddLine
            onCancel={() => setAdding(false)}
            onSave={async (body) => {
              await api(`/api/admin/invoices/${invoiceId}/lines`, { body });
              setAdding(false);
              onChange();
            }}
            onError={onError}
          />
        ) : (
          <button type="button" className="mt-3 text-sm text-fun-pink hover:underline" onClick={() => setAdding(true)}>
            Add a price
          </button>
        ))}

      <div className="mt-4 pt-4 border-t border-fun-gray-darker space-y-1 text-sm">
        <p className="flex justify-between text-fun-gray-medium">
          <span>Subtotal</span>
          <span className="font-monospace">{formatMoney(subtotal, currency)}</span>
        </p>
        {vat > 0 && (
          <p className="flex justify-between text-fun-gray-medium">
            <span>VAT ({(vatRateBps / 100).toFixed(1)}%)</span>
            <span className="font-monospace">{formatMoney(vat, currency)}</span>
          </p>
        )}
        <p className="flex justify-between font-bold">
          <span>Total</span>
          <span className="font-monospace">{formatMoney(total, currency)}</span>
        </p>
      </div>
    </Card>
  );
}

function LineForm({
  line,
  currency,
  onCancel,
  onSave,
  onDelete,
  onError,
}: {
  line: InvoiceLineRow;
  currency: string;
  onCancel: () => void;
  onSave: (body: { description: string; detail: string; mode: "time" | "price"; amount?: number }) => Promise<void>;
  onDelete: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const timed = canBillTime(line);
  const [mode, setMode] = useState<"time" | "price">(timed ? "time" : "price");
  const [description, setDescription] = useState(line.description);
  const [detail, setDetail] = useState(line.detail);
  const [amount, setAmount] = useState(fromMinor(line.amount));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      if (mode === "price") {
        const minor = toMinor(amount);
        if (minor == null || minor < 1 || Number.isNaN(minor)) return onError("Enter a price");
        await onSave({ description, detail: detail.trim(), mode, amount: minor });
      } else {
        await onSave({ description, detail: detail.trim(), mode });
      }
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-3 space-y-2">
      {timed && (
        <div className="flex rounded-full border border-fun-gray-darker p-1 text-sm w-fit" role="group" aria-label="How to bill this line">
          {(["time", "price"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-full px-3 py-1.5 min-h-[36px] capitalize ${mode === value ? "bg-fun-pink-dark" : "text-fun-gray-light"}`}
            >
              {value}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Line" placeholder="Line" className="flex-1 min-w-0" />
        {mode === "price" ? (
          <Input value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Price" placeholder="150.00" inputMode="decimal" className="sm:w-32" />
        ) : (
          <span className="sm:w-32 flex items-center font-monospace text-sm text-fun-gray-light">
            {formatMinutes(line.minutes)} · {formatMoney(Math.round((line.minutes * line.rate) / 60), currency)}
          </span>
        )}
      </div>
      <Input value={detail} onChange={(e) => setDetail(e.target.value)} aria-label="Description" placeholder="Description, shown to the client" />
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy}>
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          className="ml-auto"
          disabled={busy}
          onClick={() => {
            if (!confirm("Remove this line?")) return;
            setBusy(true);
            onDelete().catch((error) => {
              onError((error as Error).message);
              setBusy(false);
            });
          }}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function AddLine({
  onCancel,
  onSave,
  onError,
}: {
  onCancel: () => void;
  onSave: (body: { description: string; detail: string; amount: number }) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="mt-3 pt-3 border-t border-fun-gray-darker space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Line" placeholder="What was this" className="flex-1 min-w-0" />
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Price" placeholder="150.00" inputMode="decimal" className="sm:w-32" />
      </div>
      <Input value={detail} onChange={(e) => setDetail(e.target.value)} aria-label="Description" placeholder="Description, shown to the client" />
      <div className="flex gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            const minor = toMinor(amount);
            if (!description.trim()) return onError("Add a description");
            if (minor == null || minor < 1 || Number.isNaN(minor)) return onError("Enter a price");
            setBusy(true);
            try {
              await onSave({ description: description.trim(), detail: detail.trim(), amount: minor });
            } catch (error) {
              onError((error as Error).message);
              setBusy(false);
            }
          }}
        >
          Add
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
