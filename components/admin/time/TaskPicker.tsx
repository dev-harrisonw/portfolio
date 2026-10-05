import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/fetcher";
import { Select } from "@/components/admin/Form";

export type PickerTask = { id: string; title: string; status: string };
export type PickerProject = { id: string; name: string; tasks: PickerTask[] };
export type PickerClient = { id: string; name: string; projects: PickerProject[] };

type Props = {
  clients: PickerClient[];
  value: string;
  onChange: (taskId: string) => void;
  defaultClientId?: string;
  /** Called after a task is created inline so the parent can refresh its tree. */
  onTaskCreated?: (task: PickerTask, projectId: string) => void;
};

/** Cascading client → project → task picker with inline "new task". */
export default function TaskPicker({ clients, value, onChange, defaultClientId, onTaskCreated }: Props) {
  const located = useMemo(() => {
    for (const c of clients)
      for (const p of c.projects) if (p.tasks.some((t) => t.id === value)) return { clientId: c.id, projectId: p.id };
    return null;
  }, [clients, value]);

  const [clientId, setClientId] = useState(located?.clientId ?? defaultClientId ?? clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState(located?.projectId ?? "");
  const [newTask, setNewTask] = useState<string | null>(null);

  useEffect(() => {
    if (located) {
      setClientId(located.clientId);
      setProjectId(located.projectId);
    }
  }, [located]);

  const client = clients.find((c) => c.id === clientId);
  const project = client?.projects.find((p) => p.id === projectId) ?? client?.projects[0];

  useEffect(() => {
    if (project && project.id !== projectId) setProjectId(project.id);
  }, [project, projectId]);

  const createTask = async () => {
    if (!project || !newTask?.trim()) return;
    const { task } = await api("/api/admin/tasks", { body: { projectId: project.id, title: newTask.trim() } });
    onTaskCreated?.(task, project.id);
    onChange(task.id);
    setNewTask(null);
  };

  if (clients.length === 0) {
    return <p className="text-sm text-fun-gray-medium">Add a client and project first.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Select
        aria-label="Client"
        value={clientId}
        onChange={(e) => {
          setClientId(e.target.value);
          setProjectId("");
          onChange("");
        }}
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Project"
        value={project?.id ?? ""}
        onChange={(e) => {
          setProjectId(e.target.value);
          onChange("");
        }}
        disabled={!client?.projects.length}
      >
        {!client?.projects.length && <option value="">No active projects</option>}
        {client?.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      {newTask === null ? (
        <Select
          aria-label="Task"
          value={value}
          onChange={(e) => (e.target.value === "__new" ? setNewTask("") : onChange(e.target.value))}
          disabled={!project}
        >
          <option value="">Pick a task…</option>
          {project?.tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
          <option value="__new">+ New task</option>
        </Select>
      ) : (
        <input
          autoFocus
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createTask();
            }
            if (e.key === "Escape") setNewTask(null);
          }}
          onBlur={() => (newTask.trim() ? createTask() : setNewTask(null))}
          placeholder="New task, then Enter"
          className="w-full rounded-lg bg-black/20 border border-fun-pink px-3 py-2 text-sm outline-none"
        />
      )}
    </div>
  );
}
