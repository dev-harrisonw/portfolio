import { useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMinutes, formatMoney, parseDuration } from "@/lib/billing";
import { Button, Card, Input } from "@/components/admin/Form";
import TaskPicker, { type PickerClient, type PickerTask } from "@/components/admin/time/TaskPicker";

type Entry = {
  id: string;
  durationMinutes: number;
  amount: number | null;
  note: string;
  startedAt: string;
  task: { title: string };
};

export default function InvoiceTime({
  invoiceId,
  currency,
  editable,
  periodStart,
  periodEnd,
  entries,
  withheld = [],
  clients,
  onChange,
  onError,
}: {
  invoiceId: string;
  currency: string;
  editable: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  entries: Entry[];
  withheld?: Entry[];
  clients: PickerClient[];
  onChange: () => void;
  onError: (message: string) => void;
}) {
  const [tree, setTree] = useState(clients);
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState("1:00");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  const add = async () => {
    const minutes = parseDuration(duration);
    if (!minutes) return onError("Try 1:30, 1h 30m or 90m");
    setBusy(true);
    onError("");
    try {
      await api(`/api/admin/invoices/${invoiceId}/entries`, {
        body: { taskId, startedAt: new Date(`${date}T${start}:00`).toISOString(), durationMinutes: minutes, note },
      });
      setNote("");
      onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: Entry) => {
    if (!confirm(`Take “${entry.task.title}” off this invoice? The time stays in the log.`)) return;
    onError("");
    try {
      await api(`/api/admin/invoices/${invoiceId}/entries/${entry.id}`, { method: "DELETE" });
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const restore = async (entry: Entry) => {
    onError("");
    try {
      await api(`/api/admin/invoices/${invoiceId}/entries/${entry.id}`, { method: "POST" });
      onChange();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">Time on this invoice</h2>
      <Card>
        {entries.length === 0 ? (
          <p className="text-sm text-fun-gray-medium">No time on this invoice yet.</p>
        ) : (
          <ul className="divide-y divide-fun-gray-darker">
            {entries.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 py-2.5 text-sm">
                <span className="w-16 shrink-0 text-xs text-fun-gray-medium">{fmt(entry.startedAt)}</span>
                <span className="flex-1 min-w-0">
                  {entry.task.title}
                  {entry.note && <span className="text-fun-gray-light"> — {entry.note}</span>}
                </span>
                <span className="font-monospace text-xs shrink-0">
                  {entry.amount != null ? formatMoney(entry.amount, currency) : formatMinutes(entry.durationMinutes)}
                </span>
                {editable && (
                  <button type="button" onClick={() => remove(entry)} className="text-xs text-fun-gray-medium hover:text-red-300 shrink-0">
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {editable && withheld.length > 0 && (
          <div className="mt-4 border-t border-fun-gray-darker pt-3">
            <p className="text-xs text-fun-gray-medium mb-1">Left off this invoice</p>
            <ul className="divide-y divide-fun-gray-darker">
              {withheld.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-2 text-sm text-fun-gray-light">
                  <span className="w-16 shrink-0 text-xs text-fun-gray-medium">{fmt(entry.startedAt)}</span>
                  <span className="flex-1 min-w-0">
                    {entry.task.title}
                    {entry.note && <span> — {entry.note}</span>}
                  </span>
                  <button type="button" onClick={() => restore(entry)} className="text-xs text-fun-pink hover:underline shrink-0">
                    Put back
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {editable && periodStart && periodEnd && (
          <div className="mt-4 space-y-2 border-t border-fun-gray-darker pt-4">
            <TaskPicker
              clients={tree}
              value={taskId}
              onChange={setTaskId}
              defaultClientId={tree[0]?.id}
              onTaskCreated={(task: PickerTask, projectId: string) => {
                setTree((current) =>
                  current.map((client) => ({
                    ...client,
                    projects: client.projects.map((project) =>
                      project.id === projectId ? { ...project, tasks: [task, ...project.tasks] } : project
                    ),
                  }))
                );
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="Start time" />
              <Input value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration" placeholder="1:30" />
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="col-span-2 sm:col-span-3" />
              <Button onClick={add} disabled={busy || !taskId} className="col-span-2 sm:col-span-1">
                {busy ? "Adding…" : "Add time"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
