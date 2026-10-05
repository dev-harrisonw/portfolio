import { useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMinutes, parseDuration } from "@/lib/billing";
import { Button, Input } from "@/components/admin/Form";

export type EntryRowData = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  note: string;
  billable: boolean;
  task: { id: string; title: string; project: { id: string; name: string; client: { id: string; name: string } } };
};

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function EntryRow({ entry, onChange }: { entry: EntryRowData; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [duration, setDuration] = useState(
    `${Math.floor(entry.durationMinutes / 60)}:${(entry.durationMinutes % 60).toString().padStart(2, "0")}`
  );
  const [note, setNote] = useState(entry.note);
  const [billable, setBillable] = useState(entry.billable);
  const [error, setError] = useState<string | null>(null);
  const running = entry.endedAt === null;

  const save = async () => {
    setError(null);
    const minutes = parseDuration(duration);
    if (!running && (minutes == null || minutes < 1)) return setError("Try 1:30, 1h 30m or 90m");
    try {
      await api(`/api/admin/time/entries/${entry.id}`, {
        method: "PUT",
        body: { note, billable, ...(running ? {} : { durationMinutes: minutes }) },
      });
      setEditing(false);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (editing) {
    return (
      <li className="py-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="flex-1 min-w-[12rem]" />
          {!running && <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-28" aria-label="Duration" />}
          <label className="flex items-center gap-2 text-sm text-fun-gray-light">
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
            Billable
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="ml-auto"
            onClick={() =>
              confirm("Delete this entry?") &&
              api(`/api/admin/time/entries/${entry.id}`, { method: "DELETE" }).then(onChange, (e) => setError(e.message))
            }
          >
            Delete
          </Button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-4 py-3 cursor-pointer" onClick={() => setEditing(true)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">
          <span className="font-bold">{entry.task.title}</span>
          {entry.note && <span className="text-fun-gray-light"> — {entry.note}</span>}
        </p>
        <p className="text-xs text-fun-gray-medium">
          {entry.task.project.client.name} · {entry.task.project.name} · {timeOf(entry.startedAt)}
          {entry.endedAt && `–${timeOf(entry.endedAt)}`}
        </p>
      </div>
      {!entry.billable && <span className="text-xs rounded-full bg-fun-gray-darker px-2 py-0.5 text-fun-gray-light">Non-billable</span>}
      <span className={`font-monospace tabular-nums text-sm ${running ? "text-fun-pink" : ""}`}>
        {running ? "running" : formatMinutes(entry.durationMinutes)}
      </span>
    </li>
  );
}
