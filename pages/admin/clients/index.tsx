import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import { portalStatus, portalStatusLabel, portalStatusTone, type PortalStatus } from "@/lib/clients";
import AdminShell from "@/components/admin/AdminShell";
import ClientForm from "@/components/admin/ClientForm";
import { Button, Card, Input } from "@/components/admin/Form";

type ClientRow = {
  id: string;
  name: string;
  billingEmail: string;
  currency: string;
  hourlyRate: number;
  monthlyHours: number | null;
  archived: boolean;
  portal: PortalStatus;
  userCount: number;
  projectCount: number;
  buildCount: number;
  openInvoices: number;
  openTotal: number;
};

const filters: { id: "all" | "no-portal" | "invited" | "open" | "retainer" | "builds"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "no-portal", label: "No portal" },
  { id: "invited", label: "Waiting to sign in" },
  { id: "open", label: "Open invoices" },
  { id: "retainer", label: "Retainers" },
  { id: "builds", label: "Builds" },
];

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const showArchived = ctx.query.archived === "1";
  const records = await prisma.client.findMany({
    where: showArchived ? {} : { archived: false },
    orderBy: { name: "asc" },
    include: {
      users: { select: { clerkUserId: true } },
      invoices: { where: { status: { in: ["DRAFT", "SENT"] } }, select: { total: true } },
      _count: { select: { projects: true } },
      projects: { where: { billingType: "FIXED", status: { not: "ARCHIVED" } }, select: { id: true } },
    },
  });
  const clients: ClientRow[] = records.map((c) => ({
    id: c.id,
    name: c.name,
    billingEmail: c.billingEmail,
    currency: c.currency,
    hourlyRate: c.hourlyRate,
    monthlyHours: c.monthlyHours,
    archived: c.archived,
    portal: portalStatus(c.users),
    userCount: c.users.length,
    projectCount: c._count.projects,
    buildCount: c.projects.length,
    openInvoices: c.invoices.length,
    openTotal: c.invoices.reduce((s, i) => s + i.total, 0),
  }));
  return { props: { clients, showArchived } };
};

export default function ClientsPage({ clients, showArchived }: { clients: ClientRow[]; showArchived: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (q && !`${c.name} ${c.billingEmail}`.toLowerCase().includes(q)) return false;
      if (filter === "no-portal") return c.portal === "none";
      if (filter === "invited") return c.portal === "invited";
      if (filter === "open") return c.openInvoices > 0;
      if (filter === "retainer") return c.monthlyHours != null;
      if (filter === "builds") return c.buildCount > 0;
      return true;
    });
  }, [clients, query, filter]);

  const missingPortal = clients.filter((c) => !c.archived && c.portal === "none").length;

  return (
    <AdminShell
      title="Clients"
      wide
      actions={!creating && <Button onClick={() => setCreating(true)}>New client</Button>}
    >
      {creating && (
        <Card className="mb-8">
          <p className="text-sm text-fun-gray-medium mb-4">
            Create the company first, then invite their billing contact to the portal from the client record.
          </p>
          <ClientForm
            submitLabel="Create client"
            onSubmit={async (values) => {
              const { client } = await api("/api/admin/clients", { body: values });
              router.push(`/admin/clients/${client.id}`);
            }}
          />
        </Card>
      )}

      {clients.length > 0 && (
        <div className="mb-5 space-y-3">
          {missingPortal > 0 && !creating && (
            <p className="text-sm text-yellow-300">
              {missingPortal} client{missingPortal === 1 ? " has" : "s have"} no portal access — open them and invite the billing contact.
            </p>
          )}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search clients"
          />
          <div className="flex gap-2 overflow-x-auto scroll-hide pb-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs whitespace-nowrap min-h-[36px] ${
                  filter === f.id ? "bg-fun-pink-dark text-white" : "border border-fun-gray-darker text-fun-gray-light hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {clients.length === 0 && !creating ? (
        <Card className="text-center text-fun-gray-light">No clients yet. Create one, then invite them to the portal.</Card>
      ) : rows.length === 0 ? (
        <Card className="text-fun-gray-light">Nothing matches that filter.</Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-fun-gray-darker p-4 sm:p-5 hover:border-fun-pink transition-colors"
            >
              <div className="min-w-0">
                <p className="font-bold truncate">
                  {client.name}
                  {client.archived && <span className="ml-2 text-xs font-normal text-fun-gray-medium">Archived</span>}
                </p>
                <p className="text-sm text-fun-gray-medium truncate">{client.billingEmail}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 ${portalStatusTone[client.portal]}`}>{portalStatusLabel[client.portal]}</span>
                <span className="rounded-full bg-fun-gray-darker px-3 py-1 text-fun-gray-light">
                  {client.monthlyHours != null ? `${client.monthlyHours}h retainer` : "Pay as you go"}
                </span>
                {client.buildCount > 0 && (
                  <span className="rounded-full bg-fun-gray-darker px-3 py-1 text-fun-gray-light">
                    {client.buildCount} build{client.buildCount === 1 ? "" : "s"}
                  </span>
                )}
                <span className="rounded-full bg-fun-gray-darker px-3 py-1 text-fun-gray-light">
                  {formatMoney(client.hourlyRate, client.currency)}/h
                </span>
                <span className="rounded-full bg-fun-gray-darker px-3 py-1 text-fun-gray-light">
                  {client.openInvoices > 0 ? `${formatMoney(client.openTotal, client.currency)} open` : "No open invoices"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-fun-gray-medium">
        <Link href={showArchived ? "/admin/clients" : "/admin/clients?archived=1"} className="hover:text-fun-pink">
          {showArchived ? "Hide archived" : "Show archived"}
        </Link>
      </p>
    </AdminShell>
  );
}
