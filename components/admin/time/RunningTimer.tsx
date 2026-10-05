import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";
import { Button, Card, Input } from "@/components/admin/Form";
import TaskPicker, { type PickerClient, type PickerTask } from "@/components/admin/time/TaskPicker";

export type RunningEntry = {
  id: string;
  startedAt: string;
  note: string;
  task: { id: string; title: string; project: { name: string; client: { name: string } } };
} | null;

function useElapsed(startedAt?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return "0:00:00";
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  clients: PickerClient[];
  running: RunningEntry;
  defaultClientId?: string;
  onChange: (running: RunningEntry) => void;
  onTaskCreated?: (task: PickerTask, projectId: string) => void;
};

export default function RunningTimer({ clients, running, defaultClientId, onChange, onTaskCreated }: Props) {
  const [taskId, setTaskId] = useState("");
  const [note, setNote] = useState(running?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elapsed = useElapsed(running?.startedAt);

  useEffect(() => {
    setNote(running?.note ?? "");
  }, [running?.id, running?.note]);

  useEffect(() => {
    if (!running) return;
    const previous = document.title;
    document.title = `${elapsed} · ${running.task.title}`;
    return () => {
      document.title = previous;
    };
  }, [elapsed, running]);

  const act = async (fn: () => Promise<RunningEntry>) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    act(async () => {
      const { entry } = await api("/api/admin/time/timer", { body: { taskId, note } });
      return entry;
    });

  const stop = () =>
    act(async () => {
      await api("/api/admin/time/timer", { method: "DELETE", body: { note } });
      setTaskId("");
      return null;
    });

  return (
    <Card className={running ? "border-fun-pink/60 shadow-[0_0_40px_-12px_rgba(59,177,67,0.5)]" : ""}>
      {running ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fun-pink opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-fun-pink" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{running.task.title}</p>
              <p className="text-xs text-fun-gray-medium truncate">
                {running.task.project.client.name} · {running.task.project.name}
              </p>
            </div>
            <span className="font-monospace text-xl sm:text-2xl tabular-nums shrink-0">{elapsed}</span>
          </div>
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What are you working on?" className="flex-1 min-w-0" />
            <Button onClick={stop} disabled={busy} className="bg-red-500 hover:bg-red-400 shrink-0">
              Stop
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <TaskPicker clients={clients} value={taskId} onChange={setTaskId} defaultClientId={defaultClientId} onTaskCreated={onTaskCreated} />
          <div className="flex gap-2">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What are you working on?" className="min-w-0" />
            <Button onClick={start} disabled={busy || !taskId} className="shrink-0">
              Start
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </Card>
  );
}
