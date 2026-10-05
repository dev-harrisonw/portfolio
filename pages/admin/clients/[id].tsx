import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMinutes, formatMoney } from "@/lib/billing";
import { priceUsage } from "@/lib/invoicing/calc";
import { getClientUsage, type ClientUsage } from "@/lib/usage";
import { dueLabel, invoiceStatusTone, portalStatus, portalStatusLabel } from "@/lib/clients";
import InvoiceActions from "@/components/admin/InvoiceActions";
import { siteUrl } from "@/lib/site";
import AdminShell from "@/components/admin/AdminShell";
import ClientForm, { type ClientFormValues } from "@/components/admin/ClientForm";
import ProjectPanel, { type ProjectRow } from "@/components/admin/ProjectPanel";
import PortalPeople, { type PortalUser } from "@/components/admin/PortalPeople";
import { Button, Card, Input } from "@/components/admin/Form";

type InvoiceRow = {
  id: string;
  number: string;
  kind: "PERIOD" | "STAGE";
  status: "DRAFT" | "SENT" | "PAID" | "VOID";
  total: number;
  currency: string;
  dueAt: string | null;
  checkoutUrl: string | null;
  createdAt: string;
};

type ClientDetail = ClientFormValues & {
  id: string;
  users: PortalUser[];
  projects: ProjectRow[];
};

type Props = {
  client: ClientDetail;
  usage: ClientUsage | null;
  estimateTotal: number;
  invoices: InvoiceRow[];
  siteUrl: string;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const id = String(ctx.params?.id);
  const [record, usage, invoices] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        users: { orderBy: { createdAt: "asc" } },
        projects: {
          orderBy: [{ status: "asc" }, { name: "asc" }],
          include: {
            tasks: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
            stages: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
    getClientUsage(id, undefined, new Date(), { audience: "admin" }),
    prisma.invoice.findMany({
      where: { clientId: id, status: { not: "VOID" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, number: true, kind: true, status: true, total: true, currency: true, dueAt: true, checkoutUrl: true, createdAt: true },
    }),
  ]);
  if (!record) return { notFound: true };
  return {
    props: JSON.parse(
      JSON.stringify({
        client: record,
        usage,
        estimateTotal: usage ? priceUsage(usage).total : 0,
        invoices,
        siteUrl: siteUrl(),
      })
    ),
  };
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 min-w-0">
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-fun-gray-light">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-1 font-monospace tabular-nums truncate">{value}</p>
      {sub && <p className="text-xs text-fun-gray-medium mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

export default function ClientDetailPage({ client, usage, estimateTotal, invoices, siteUrl: origin }: Props) {
  const router = useRouter();
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const [users, setUsers] = useState(client.users);
  const [projectName, setProjectName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [exportMonth, setExportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setUsers(client.users);
  }, [client.users]);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const access = portalStatus(users);
  const allowance = usage?.allowances[0];
  const openInvoices = invoices.filter((i) => i.status === "DRAFT" || i.status === "SENT");
  const openTotal = openInvoices.reduce((s, i) => s + i.total, 0);

  return (
    <AdminShell
      eyebrow="Client"
      title={client.name}
      wide
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/portal?client=${client.id}`}
            className="rounded-full border border-fun-gray-darker px-4 py-2.5 sm:py-2 text-sm hover:border-fun-pink min-h-[44px] sm:min-h-0 inline-flex items-center"
          >
            Preview portal
          </Link>
          <Link
            href={`/admin/time?client=${client.id}`}
            className="rounded-full border border-fun-gray-darker px-4 py-2.5 sm:py-2 text-sm hover:border-fun-pink min-h-[44px] sm:min-h-0 inline-flex items-center"
          >
            Log time
          </Link>
          <Button
            variant="danger"
            onClick={() =>
              confirm(`Archive ${client.name}? Their history and invoices are kept.`) &&
              api(`/api/admin/clients/${client.id}`, { method: "DELETE" }).then(() => router.push("/admin/clients"))
            }
          >
            Archive
          </Button>
        </div>
      }
    >
      {(error || notice) && <p className={`mb-6 text-sm ${error ? "text-red-400" : "text-fun-pink"}`}>{error || notice}</p>}

      {access === "none" && (
        <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
          {client.name} can&apos;t see the portal yet. Invite {client.billingEmail} so they can sign in and pay invoices.
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat
          label="This period"
          value={allowance ? formatMinutes(allowance.usedMinutes) : "—"}
          sub={
            allowance?.availableMinutes != null
              ? `${formatMinutes(allowance.remainingMinutes ?? 0)} remaining · ${usage?.period.days.left ?? 0} days left`
              : usage
                ? "Pay as you go"
                : undefined
          }
        />
        <Stat label="Unbilled so far" value={formatMoney(estimateTotal, client.currency)} sub="Current period, inc. VAT" />
        <Stat
          label="Open invoices"
          value={formatMoney(openTotal, client.currency)}
          sub={openInvoices.length ? `${openInvoices.length} draft or sent` : "Nothing outstanding"}
        />
        <Stat label="Portal" value={portalStatusLabel[access]} sub={client.billingEmail} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-10">
        <PortalPeople
          clientId={client.id}
          clientName={client.name}
          billingEmail={client.billingEmail}
          siteUrl={origin}
          users={users}
          onUsersChange={setUsers}
          onNotice={setNotice}
          onError={(message) => setError(message || null)}
        />

        <section className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold">Invoices</h2>
            <Link href="/admin/invoices" className="text-sm text-fun-pink hover:underline">
              All invoices
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-fun-gray-medium">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-fun-gray-darker">
              {invoices.map((inv) => {
                const due = dueLabel(inv.dueAt, inv.status);
                return (
                  <li key={inv.id} className="py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <Link href={`/admin/invoices/${inv.id}`} className="font-bold hover:text-fun-pink">
                          {inv.number}
                        </Link>
                        <span className="text-fun-gray-medium"> · {inv.kind === "STAGE" ? "Build" : "Period"}</span>
                        {due && <span className={`block text-[11px] ${due.overdue ? "text-red-300" : "text-fun-gray-medium"}`}>{due.text}</span>}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="font-monospace">{formatMoney(inv.total, inv.currency)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] uppercase ${invoiceStatusTone(inv.status)}`}>
                          {inv.status.toLowerCase()}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2">
                      <InvoiceActions invoice={inv} onDone={refresh} onError={(message) => setError(message)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              disabled={drafting}
              onClick={() =>
                run(async () => {
                  setDrafting(true);
                  try {
                    await api("/api/admin/invoices", { body: { kind: "PERIOD", clientId: client.id, periodOffset: -1 } });
                    setNotice("Drafted last period.");
                  } finally {
                    setDrafting(false);
                  }
                })
              }
            >
              {drafting ? "Drafting…" : "Draft last period"}
            </Button>
            <Button
              variant="ghost"
              disabled={drafting}
              onClick={() =>
                run(async () => {
                  setDrafting(true);
                  try {
                    await api("/api/admin/invoices", { body: { kind: "PERIOD", clientId: client.id, periodOffset: 0 } });
                    setNotice("Drafted this period.");
                  } finally {
                    setDrafting(false);
                  }
                })
              }
            >
              Draft this period
            </Button>
          </div>
        </section>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Projects &amp; tasks</h2>
        <div className="grid gap-4">
          {client.projects.map((project) => (
            <ProjectPanel key={project.id} project={project} currency={client.currency} onChange={refresh} />
          ))}
        </div>
        {client.projects.length === 0 && <p className="text-sm text-fun-gray-medium mb-3">Add a retainer project or a fixed-price build.</p>}
        <form
          className="mt-4 flex flex-col sm:flex-row gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api("/api/admin/projects", { body: { clientId: client.id, name: projectName } });
              setProjectName("");
            });
          }}
        >
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="New project name" />
          <Button type="submit" disabled={!projectName.trim()}>
            Add project
          </Button>
        </form>
      </section>

      {usage && usage.entries.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">This period&apos;s time</h2>
            <Link href={`/admin/time?client=${client.id}`} className="text-sm text-fun-pink hover:underline">
              Log more
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-fun-gray-darker">
              {usage.entries
                .slice()
                .reverse()
                .slice(0, 8)
                .map((e) => (
                  <li key={e.id} className="flex items-start sm:items-center gap-3 py-2.5 text-sm">
                    <span className="w-16 shrink-0 text-xs text-fun-gray-medium">
                      {new Date(e.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-bold">{e.taskTitle}</span>
                      <span className="text-fun-gray-medium"> · {e.projectName}</span>
                      {e.note && <span className="text-fun-gray-light"> — {e.note}</span>}
                    </span>
                    <span className="font-monospace text-xs shrink-0">{formatMinutes(e.durationMinutes)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Exports</h2>
        <Card className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={exportMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setExportMonth(e.target.value)}
            className="rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2.5 sm:py-2 text-sm min-h-[44px] sm:min-h-0"
            aria-label="Period starting in"
          />
          {(["csv", "pdf"] as const).map((format) => (
            <a
              key={format}
              href={`/api/admin/exports/timesheet?clientId=${client.id}&period=${exportMonth}&format=${format}`}
              className="rounded-full border border-fun-gray-darker px-4 py-2.5 sm:py-2 text-sm hover:border-fun-pink min-h-[44px] sm:min-h-0 inline-flex items-center"
            >
              {format === "pdf" ? "Timesheet PDF" : "Entries CSV"}
            </a>
          ))}
        </Card>
      </section>

      <section>
        <button type="button" className="flex items-center gap-2 text-xl font-bold mb-4" onClick={() => setSettingsOpen((o) => !o)}>
          Billing settings
          <span className="text-sm font-normal text-fun-gray-medium">{settingsOpen ? "Hide" : "Show"}</span>
        </button>
        {settingsOpen && (
          <Card>
            <ClientForm
              initial={client}
              submitLabel="Save settings"
              onSubmit={async (values) => {
                await api(`/api/admin/clients/${client.id}`, { method: "PUT", body: values });
                setNotice("Billing settings saved.");
                refresh();
              }}
            />
          </Card>
        )}
      </section>
    </AdminShell>
  );
}
