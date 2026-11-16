import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMinutes, formatMoney } from "@/lib/billing";
import { Button } from "@/components/admin/Form";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type TaskDetail = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  project: {
    id: string;
    name: string;
    dueDate: string | null;
    billingType: "TIME" | "FIXED";
    client: { id: string; name: string; currency: string };
  };
  entries: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number;
    amount: number | null;
    note: string;
    billable: boolean;
  }[];
};

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "DONE", label: "Done" },
];

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function TaskModal({
  taskId,
  onClose,
  onStatus,
  onStart,
  onDeleted,
}: {
  taskId: string;
  onClose: () => void;
  onStatus: (id: string, status: TaskStatus) => void;
  onStart: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ task: TaskDetail }>(`/api/admin/tasks/${taskId}`)
      .then((data) => {
        if (!cancelled) setTask(data.task);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const minutes = (task?.entries ?? []).filter((e) => e.amount == null).reduce((sum, e) => sum + e.durationMinutes, 0);
  const priced = (task?.entries ?? []).filter((e) => e.amount != null).reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const currency = task?.project.client.currency || "GBP";
  const logged = task?.entries.length ?? 0;

  const remove = async () => {
    if (!task || logged > 0) return;
    if (!confirm(`Delete “${task.title}”?`)) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      onDeleted(task.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-dialog-title"
        className="dd-panel w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-4 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        {!task ? (
          <p className="text-sm text-fun-gray-medium">{error ?? "Loading…"}</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="task-dialog-title" className="text-lg font-bold leading-snug">
                  {task.title}
                </h2>
                <Link href={`/admin/clients/${task.project.client.id}`} className="text-sm text-fun-gray hover:text-fun-pink">
                  {task.project.client.name} · {task.project.name}
                </Link>
              </div>
              <button type="button" onClick={onClose} className="text-sm text-fun-gray-medium hover:text-white shrink-0" aria-label="Close">
                Close
              </button>
            </div>

            <label className="mt-4 block text-[11px] uppercase tracking-wider text-fun-gray-light">
              Status
              <select
                value={task.status}
                onChange={(e) => {
                  const status = e.target.value as TaskStatus;
                  setTask({ ...task, status, completedAt: status === "DONE" ? new Date().toISOString() : null });
                  onStatus(task.id, status);
                }}
                className="dd-input mt-1 w-full px-3 py-2 text-sm"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </label>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-fun-gray-light">Billing</dt>
                <dd className="mt-1">{task.project.billingType === "FIXED" ? "Fixed price" : "Time"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-fun-gray-light">Project due</dt>
                <dd className="mt-1">{fmt(task.project.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-fun-gray-light">Added</dt>
                <dd className="mt-1">{fmt(task.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-fun-gray-light">{task.completedAt ? "Completed" : "Updated"}</dt>
                <dd className="mt-1">{fmt(task.completedAt ?? task.updatedAt)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg border border-fun-gray-darker px-3 py-2 text-sm">
              <p>
                <span className="font-monospace">{logged}</span> {logged === 1 ? "entry" : "entries"}
                {minutes > 0 && <span className="text-fun-gray-light"> · {formatMinutes(minutes)}</span>}
                {priced > 0 && <span className="text-fun-gray-light"> · {formatMoney(priced, currency)}</span>}
              </p>
              {task.entries.length > 0 && (
                <ul className="mt-2 divide-y divide-fun-gray-darker">
                  {task.entries.slice(0, 8).map((entry) => (
                    <li key={entry.id} className="flex items-start gap-3 py-1.5 text-xs">
                      <span className="w-16 shrink-0 text-fun-gray-medium">{fmt(entry.startedAt)}</span>
                      <span className="min-w-0 flex-1 text-fun-gray-light">{entry.note || (entry.endedAt ? "Logged" : "Running")}</span>
                      <span className="font-monospace shrink-0">
                        {entry.amount != null ? formatMoney(entry.amount, currency) : entry.endedAt ? formatMinutes(entry.durationMinutes) : "running"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {task.status !== "DONE" && (
                <Button
                  onClick={() => {
                    onStart(task.id);
                    onClose();
                  }}
                >
                  Start timer
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button variant="danger" className="sm:ml-auto" disabled={busy || logged > 0} onClick={remove}>
                Delete
              </Button>
            </div>
            {logged > 0 && <p className="mt-2 text-xs text-fun-gray-medium">This task has logged time, so it stays. Mark it done instead.</p>}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
