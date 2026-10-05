import { useState } from "react";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import { PAYMENT_TERMS, projectProgress, stageAmounts } from "@/lib/projects";
import { Button, Card, Field, fromMinor, Input, Select, toInt, toMinor } from "@/components/admin/Form";
import PaymentStages from "@/components/admin/PaymentStages";

export type TaskRow = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE"; completedAt: string | null };
export type ProjectRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  hourlyRate: number | null;
  monthlyHours: number | null;
  rolloverPolicy: "EXPIRE" | "ROLLOVER" | "ROLLOVER_CAPPED" | null;
  rolloverCapHours: number | null;
  billingType: "TIME" | "FIXED";
  fixedPrice: number | null;
  paymentTerms: PaymentTermsKey | null;
  startDate: string | null;
  dueDate: string | null;
  progressOverride: number | null;
  stages: StageRow[];
  tasks: TaskRow[];
};
export type StageRow = { id: string; label: string; percent: number; status: "PENDING" | "DUE" | "INVOICED" | "PAID"; reachedAt: string | null };
type PaymentTermsKey = keyof typeof PAYMENT_TERMS;

const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

const statusStyles: Record<TaskRow["status"], string> = {
  TODO: "bg-fun-gray-darker text-fun-gray-light",
  IN_PROGRESS: "bg-yellow-500/15 text-yellow-300",
  DONE: "bg-fun-pink-dark text-fun-pink-light",
};
const nextStatus: Record<TaskRow["status"], TaskRow["status"]> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" };
const statusLabel: Record<TaskRow["status"], string> = { TODO: "To do", IN_PROGRESS: "In progress", DONE: "Done" };

export default function ProjectPanel({ project, currency, onChange }: { project: ProjectRow; currency: string; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState(project.status);
  const [rate, setRate] = useState(fromMinor(project.hourlyRate));
  const [hours, setHours] = useState(project.monthlyHours?.toString() ?? "");
  const [policy, setPolicy] = useState(project.rolloverPolicy ?? "");
  const [cap, setCap] = useState(project.rolloverCapHours?.toString() ?? "");
  const [billingType, setBillingType] = useState(project.billingType);
  const [fixedPrice, setFixedPrice] = useState(fromMinor(project.fixedPrice));
  const [startDate, setStartDate] = useState(dateInput(project.startDate));
  const [dueDate, setDueDate] = useState(dateInput(project.dueDate));
  const [progressOverride, setProgressOverride] = useState(project.progressOverride?.toString() ?? "");
  const [taskTitle, setTaskTitle] = useState("");
  const isFixed = project.billingType === "FIXED";
  const progress = projectProgress(project.tasks, project.progressOverride);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveProject = () =>
    run(async () => {
      await api(`/api/admin/projects/${project.id}`, {
        method: "PUT",
        body:
          billingType === "FIXED"
            ? {
                name,
                status,
                billingType,
                fixedPrice: toMinor(fixedPrice),
                startDate: startDate || null,
                dueDate: dueDate || null,
                progressOverride: toInt(progressOverride),
                monthlyHours: null,
                rolloverPolicy: null,
                rolloverCapHours: null,
              }
            : {
                name,
                status,
                billingType,
                hourlyRate: toMinor(rate),
                monthlyHours: toInt(hours),
                rolloverPolicy: hours.trim() && policy ? policy : null,
                rolloverCapHours: policy === "ROLLOVER_CAPPED" ? toInt(cap) : null,
              },
      });
      setEditing(false);
    });

  const addTask = () =>
    run(async () => {
      await api("/api/admin/tasks", { body: { projectId: project.id, title: taskTitle } });
      setTaskTitle("");
    });

  const open = project.tasks.filter((t) => t.status !== "DONE");
  const done = project.tasks.filter((t) => t.status === "DONE");

  return (
    <Card className={project.status === "ARCHIVED" ? "opacity-60" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-lg">
            {project.name}
            <span className={`ml-2 align-middle rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${isFixed ? "bg-blue-500/15 text-blue-300" : "bg-fun-gray-darker text-fun-gray-light"}`}>
              {isFixed ? "Fixed price" : "Time"}
            </span>
          </p>
          <p className="text-xs text-fun-gray-medium mt-1">
            {project.status !== "ACTIVE" && <span className="uppercase mr-2">{project.status.toLowerCase()}</span>}
            {isFixed ? (
              <>
                {project.fixedPrice != null ? formatMoney(project.fixedPrice, currency) : "No price set"} · {progress.percent}% complete
                {progress.isOverride && " (manual)"}
                {project.dueDate && ` · due ${new Date(project.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
              </>
            ) : (
              <>
                {project.hourlyRate != null ? `${formatMoney(project.hourlyRate, currency)}/h override` : "Client rate"}
                {project.monthlyHours != null && ` · own allowance ${project.monthlyHours}h`}
              </>
            )}
          </p>
          {isFixed && (
            <div className="mt-2 h-1.5 w-56 rounded-full bg-fun-gray-darker">
              <div className="h-full rounded-full bg-fun-pink" style={{ width: `${progress.percent}%` }} />
            </div>
          )}
        </div>
        <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? "Close" : "Settings"}
        </Button>
      </div>

      {editing && (
        <div className="grid gap-4 sm:grid-cols-3 mt-5 border-t border-fun-gray-darker pt-5">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectRow["status"])}>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <Field label="Billing" hint={billingType === "FIXED" ? "Client sees progress, not hours" : "Retainer or hourly, per client settings"}>
            <Select value={billingType} onChange={(e) => setBillingType(e.target.value as ProjectRow["billingType"])}>
              <option value="TIME">Time (retainer / hourly)</option>
              <option value="FIXED">Fixed-price build</option>
            </Select>
          </Field>
          {billingType === "FIXED" ? (
            <>
              <Field label="Fixed price">
                <Input inputMode="decimal" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} placeholder="4500.00" />
              </Field>
              <Field label="Start date">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Target date">
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </Field>
              <Field label="Progress override %" hint={`Blank = from tasks (${progress.computed}%)`}>
                <Input inputMode="numeric" value={progressOverride} onChange={(e) => setProgressOverride(e.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Rate override" hint="Blank = client rate">
                <Input inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
              </Field>
              <Field label="Own allowance (hours)" hint="Blank = shares the client's">
                <Input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
              </Field>
              <Field label="Unused hours" hint="Blank = client's setting">
                <Select value={policy} onChange={(e) => setPolicy(e.target.value as typeof policy)} disabled={!hours.trim()}>
                  <option value="">Use client setting</option>
                  <option value="EXPIRE">Expire</option>
                  <option value="ROLLOVER">Roll over</option>
                  <option value="ROLLOVER_CAPPED">Roll over (capped)</option>
                </Select>
              </Field>
              <Field label="Rollover cap (hours)">
                <Input inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} disabled={policy !== "ROLLOVER_CAPPED"} />
              </Field>
            </>
          )}
          <div className="sm:col-span-3 flex gap-2">
            <Button onClick={saveProject}>Save project</Button>
            <Button
              variant="danger"
              onClick={() =>
                confirm("Delete this project? Projects with logged time are archived instead.") &&
                run(() => api(`/api/admin/projects/${project.id}`, { method: "DELETE" }))
              }
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {isFixed && (
        <PaymentStages
          projectId={project.id}
          price={project.fixedPrice}
          currency={currency}
          terms={project.paymentTerms}
          stages={project.stages}
          amounts={stageAmounts(project.fixedPrice ?? 0, project.stages)}
          onChange={onChange}
        />
      )}

      <ul className="mt-5 space-y-2">
        {[...open, ...done].map((task) => (
          <li key={task.id} className="group flex items-center gap-3 text-sm">
            <button
              type="button"
              title="Change status"
              onClick={() => run(() => api(`/api/admin/tasks/${task.id}`, { method: "PUT", body: { status: nextStatus[task.status] } }))}
              className={`rounded-full px-2 py-0.5 text-xs w-24 shrink-0 ${statusStyles[task.status]}`}
            >
              {statusLabel[task.status]}
            </button>
            <span className={task.status === "DONE" ? "text-fun-gray-medium line-through" : ""}>{task.title}</span>
            <button
              type="button"
              onClick={() => run(() => api(`/api/admin/tasks/${task.id}`, { method: "DELETE" }))}
              className="ml-auto text-xs text-fun-gray-medium opacity-0 group-hover:opacity-100 hover:text-red-300"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (taskTitle.trim()) addTask();
        }}
      >
        <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task…" />
        <Button type="submit" variant="ghost" disabled={!taskTitle.trim()}>
          Add
        </Button>
      </form>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </Card>
  );
}
