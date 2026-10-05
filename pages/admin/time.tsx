import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMinutes, parseDuration } from "@/lib/billing";
import { getRunningEntry, startOfWeek } from "@/lib/time";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Card, Input, Select } from "@/components/admin/Form";
import RunningTimer, { type RunningEntry } from "@/components/admin/time/RunningTimer";
import TaskPicker, { type PickerClient, type PickerTask } from "@/components/admin/time/TaskPicker";
import EntryRow, { type EntryRowData } from "@/components/admin/time/EntryRow";
import Skeleton from "@/components/utility/Skeleton";

type Props = { clients: PickerClient[]; running: RunningEntry };
type View = "week" | "month";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const [clients, running] = await Promise.all([
    prisma.client.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        projects: {
          where: { status: "ACTIVE" },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            tasks: { where: { status: { not: "DONE" } }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true } },
          },
        },
      },
    }),
    getRunningEntry(),
  ]);
  return { props: JSON.parse(JSON.stringify({ clients, running })) };
};

function rangeFor(view: View, anchor: Date) {
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: new Date(from.getTime() + 7 * 86400000) };
  }
  const from = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  return { from, to: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1)) };
}

function shiftAnchor(view: View, anchor: Date, dir: number) {
  const d = new Date(anchor);
  if (view === "week") d.setUTCDate(d.getUTCDate() + 7 * dir);
  else d.setUTCMonth(d.getUTCMonth() + dir, 1);
  return d;
}

const dayKey = (iso: string) => iso.slice(0, 10);
const dayLabel = (key: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });

export default function TimePage({ clients: initialClients, running: initialRunning }: Props) {
  const router = useRouter();
  const clientFilter = typeof router.query.client === "string" ? router.query.client : "";
  const [clients, setClients] = useState(initialClients);
  const [running, setRunning] = useState<RunningEntry>(initialRunning);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [entries, setEntries] = useState<EntryRowData[] | null>(null);
  const [showManual, setShowManual] = useState(false);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() });
    if (clientFilter) params.set("clientId", clientFilter);
    const data = await api<{ entries: EntryRowData[] }>(`/api/admin/time/entries?${params}`);
    setEntries(data.entries);
  }, [range, clientFilter]);

  useEffect(() => {
    setEntries(null);
    load();
  }, [load]);

  const addTask = (task: PickerTask, projectId: string) =>
    setClients((prev) =>
      prev.map((c) => ({
        ...c,
        projects: c.projects.map((p) => (p.id === projectId ? { ...p, tasks: [task, ...p.tasks] } : p)),
      }))
    );

  const grouped = useMemo(() => {
    const map = new Map<string, EntryRowData[]>();
    for (const e of entries ?? []) {
      const key = dayKey(e.startedAt);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()];
  }, [entries]);

  const done = (entries ?? []).filter((e) => e.endedAt);
  const total = done.reduce((s, e) => s + e.durationMinutes, 0);
  const billable = done.filter((e) => e.billable).reduce((s, e) => s + e.durationMinutes, 0);

  const rangeLabel =
    view === "week"
      ? `${range.from.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} – ${new Date(
          range.to.getTime() - 86400000
        ).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
      : range.from.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <AdminShell title="Time" wide>
      <RunningTimer
        clients={clients}
        running={running}
        defaultClientId={clientFilter || undefined}
        onTaskCreated={addTask}
        onChange={(next) => {
          setRunning(next);
          load();
        }}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-fun-gray-darker p-1 text-sm">
          {(["week", "month"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 capitalize ${view === v ? "bg-fun-pink-dark" : "text-fun-gray-light"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => setAnchor((a) => shiftAnchor(view, a, -1))} aria-label="Previous">
            ←
          </Button>
          <span className="w-48 text-center text-sm font-bold">{rangeLabel}</span>
          <Button variant="ghost" onClick={() => setAnchor((a) => shiftAnchor(view, a, 1))} aria-label="Next">
            →
          </Button>
        </div>
        <Select
          aria-label="Filter by client"
          value={clientFilter}
          onChange={(e) => router.replace({ query: e.target.value ? { client: e.target.value } : {} }, undefined, { shallow: true })}
          className="w-auto"
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <span>
            <span className="text-fun-gray-medium">Total </span>
            <span className="font-mono">{formatMinutes(total)}</span>
          </span>
          <span>
            <span className="text-fun-gray-medium">Billable </span>
            <span className="font-mono text-fun-pink">{formatMinutes(billable)}</span>
          </span>
          <Button variant="ghost" onClick={() => setShowManual((v) => !v)}>
            {showManual ? "Close" : "Add entry"}
          </Button>
        </div>
      </div>

      {showManual && (
        <ManualEntry
          clients={clients}
          defaultClientId={clientFilter || undefined}
          onTaskCreated={addTask}
          onSaved={() => {
            setShowManual(false);
            load();
          }}
        />
      )}

      <div className="mt-6 space-y-6">
        {entries === null ? (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : grouped.length === 0 ? (
          <Card className="text-center text-fun-gray-light">No time logged in this {view}.</Card>
        ) : (
          grouped.map(([key, list]) => (
            <Card key={key}>
              <div className="flex items-center justify-between border-b border-fun-gray-darker pb-2">
                <p className="font-bold">{dayLabel(key)}</p>
                <p className="font-mono text-sm text-fun-gray-light">
                  {formatMinutes(list.filter((e) => e.endedAt).reduce((s, e) => s + e.durationMinutes, 0))}
                </p>
              </div>
              <ul className="divide-y divide-fun-gray-darker">
                {list.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onChange={load} />
                ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </AdminShell>
  );
}

function ManualEntry({
  clients,
  defaultClientId,
  onTaskCreated,
  onSaved,
}: {
  clients: PickerClient[];
  defaultClientId?: string;
  onTaskCreated: (task: PickerTask, projectId: string) => void;
  onSaved: () => void;
}) {
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState("1:00");
  const [note, setNote] = useState("");
  const [billable, setBillable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    const minutes = parseDuration(duration);
    if (!minutes) return setError("Try 1:30, 1h 30m or 90m");
    try {
      await api("/api/admin/time/entries", {
        body: { taskId, startedAt: new Date(`${date}T${start}:00`).toISOString(), durationMinutes: minutes, note, billable },
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Card className="mt-4 space-y-3">
      <TaskPicker clients={clients} value={taskId} onChange={setTaskId} defaultClientId={defaultClientId} onTaskCreated={onTaskCreated} />
      <div className="flex flex-wrap gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" aria-label="Date" />
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-32" aria-label="Start time" />
        <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-28" aria-label="Duration" placeholder="1:30" />
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="flex-1 min-w-[12rem]" />
        <label className="flex items-center gap-2 text-sm text-fun-gray-light">
          <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
          Billable
        </label>
        <Button onClick={save} disabled={!taskId}>
          Save entry
        </Button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </Card>
  );
}
