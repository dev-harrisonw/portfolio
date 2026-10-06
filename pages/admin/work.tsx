import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import type { WorkDashboard } from "@/lib/work";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Card, Input, Select } from "@/components/admin/Form";
import RunningTimer, { type RunningEntry } from "@/components/admin/time/RunningTimer";
import { MotionItem, MotionSection } from "@/components/utility/Motion";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "DONE", label: "Done" },
];
const statusTone: Record<TaskStatus, string> = {
  TODO: "bg-fun-gray-darker text-fun-gray-light",
  IN_PROGRESS: "bg-yellow-500/15 text-yellow-300",
  DONE: "bg-fun-pink-dark text-fun-pink-light",
};

type Props = { data: WorkDashboard };

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const { getWorkDashboard } = await import("@/lib/work");
  const data = await getWorkDashboard();
  return { props: { data: JSON.parse(JSON.stringify(data)) } };
};

export default function WorkPage({ data }: Props) {
  const router = useRouter();
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const [running, setRunning] = useState<RunningEntry>(data.running as RunningEntry);
  const [tasks, setTasks] = useState(data.tasks);
  const [hideDone, setHideDone] = useState(true);
  const [clientId, setClientId] = useState(data.pickerTree[0]?.id ?? "");
  const [projectId, setProjectId] = useState(data.pickerTree[0]?.projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = data.pickerTree.find((c) => c.id === clientId);
  const projects = client?.projects ?? [];

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, typeof tasks> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) {
      if (hideDone && t.status === "DONE") continue;
      map[t.status as TaskStatus].push(t);
    }
    return map;
  }, [tasks, hideDone]);

  const setClient = (id: string) => {
    setClientId(id);
    const first = data.pickerTree.find((c) => c.id === id)?.projects[0]?.id ?? "";
    setProjectId(first);
  };

  const addTask = async () => {
    if (!projectId || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { task } = await api("/api/admin/tasks", { body: { projectId, title: title.trim(), status: "TODO" } });
      const project = projects.find((p) => p.id === projectId) ?? client?.projects.find((p) => p.id === projectId);
      const owner = data.pickerTree.find((c) => c.projects.some((p) => p.id === projectId));
      setTasks((rows) => [
        {
          id: task.id,
          title: task.title,
          status: task.status,
          updatedAt: new Date().toISOString(),
          completedAt: null,
          project: {
            id: projectId,
            name: project?.name ?? "Project",
            dueDate: null,
            billingType: "TIME",
            client: { id: owner?.id ?? "", name: owner?.name ?? "" },
          },
          _count: { entries: 0 },
        },
        ...rows,
      ]);
      setTitle("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: TaskStatus) => {
    const previous = tasks;
    setTasks((rows) => rows.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await api(`/api/admin/tasks/${id}`, { method: "PUT", body: { status } });
    } catch (e) {
      setTasks(previous);
      setError((e as Error).message);
    }
  };

  const start = async (taskId: string) => {
    const { entry } = await api("/api/admin/time/timer", { body: { taskId } });
    setRunning(entry);
    setTasks((rows) => rows.map((t) => (t.id === taskId && t.status === "TODO" ? { ...t, status: "IN_PROGRESS" } : t)));
  };

  return (
    <AdminShell title="Work" wide>
      <RunningTimer
        clients={data.pickerTree}
        running={running}
        onChange={(next) => {
          setRunning(next);
          if (!next) refresh();
        }}
      />

      <MotionSection className="mt-6 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MotionItem>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">To do</p>
            <p className="text-2xl font-bold font-monospace mt-1">{data.counts.TODO}</p>
          </Card>
        </MotionItem>
        <MotionItem>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">In progress</p>
            <p className="text-2xl font-bold font-monospace mt-1">{data.counts.IN_PROGRESS}</p>
          </Card>
        </MotionItem>
        <MotionItem>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Overdue projects</p>
            <p className="text-2xl font-bold font-monospace mt-1">{data.overdueProjects.length}</p>
          </Card>
        </MotionItem>
        <MotionItem>
          <Card>
            <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Stages due</p>
            <p className="text-2xl font-bold font-monospace mt-1">{data.dueStages.length}</p>
          </Card>
        </MotionItem>
      </MotionSection>

      {(data.overdueProjects.length > 0 || data.dueStages.length > 0) && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {data.overdueProjects.length > 0 && (
            <Card>
              <h2 className="font-bold mb-3">Past due</h2>
              <ul className="space-y-2 text-sm">
                {data.overdueProjects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/clients/${p.client.id}`} className="hover:text-fun-pink">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-fun-gray-medium"> · {p.client.name}</span>
                    </Link>
                    {p.dueDate && (
                      <span className="block text-xs text-red-300">
                        Due {new Date(p.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {data.dueStages.length > 0 && (
            <Card>
              <h2 className="font-bold mb-3">Payment stages ready</h2>
              <ul className="space-y-2 text-sm">
                {data.dueStages.map((s) => (
                  <li key={s.id}>
                    <Link href={`/admin/clients/${s.project.client.id}`} className="hover:text-fun-pink">
                      {s.project.client.name} · {s.project.name}
                    </Link>
                    <span className="block text-xs text-fun-gray-medium">
                      {s.label} · {s.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      <form
        className="mt-8 flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addTask();
        }}
      >
        <Select value={clientId} onChange={(e) => setClient(e.target.value)} aria-label="Client">
          {data.pickerTree.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project" disabled={!projects.length}>
          {projects.length === 0 ? <option value="">No active projects</option> : null}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" className="sm:flex-1" />
        <Button disabled={busy || !projectId || !title.trim()}>{busy ? "Adding…" : "Add task"}</Button>
      </form>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <div className="mt-6 flex justify-end">
        <label className="text-xs text-fun-gray-medium flex items-center gap-2">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Hide done
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.id}>
            <h2 className="text-xs uppercase tracking-wider text-fun-gray-light mb-3 flex items-center justify-between">
              {col.label}
              <span className="font-monospace">{grouped[col.id].length}</span>
            </h2>
            <ul className="space-y-3">
              {grouped[col.id].length === 0 ? (
                <li className="text-xs text-fun-gray-medium rounded-xl border border-dashed border-fun-gray-darker px-3 py-6 text-center">Empty</li>
              ) : (
                grouped[col.id].map((t) => (
                  <li key={t.id} className="rounded-xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold">{t.title}</p>
                        <Link href={`/admin/clients/${t.project.client.id}`} className="text-xs text-fun-gray hover:text-fun-pink">
                          {t.project.client.name} · {t.project.name}
                        </Link>
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => setStatus(t.id, e.target.value as TaskStatus)}
                        className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wider outline-none bg-transparent border-0 cursor-pointer ${statusTone[t.status as TaskStatus]}`}
                        aria-label="Task status"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {t.status !== "DONE" && (
                      <button type="button" onClick={() => start(t.id)} className="mt-3 text-xs text-fun-pink hover:underline">
                        ▶ Start timer
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
