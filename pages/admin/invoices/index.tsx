import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/billing";
import { dueLabel, invoiceStatusTone } from "@/lib/clients";
import AdminShell from "@/components/admin/AdminShell";
import InvoiceActions, { type InvoiceActionStatus } from "@/components/admin/InvoiceActions";
import { Button, Card } from "@/components/admin/Form";

type InvoiceRow = {
  id: string;
  number: string;
  kind: "PERIOD" | "STAGE";
  status: InvoiceActionStatus;
  total: number;
  currency: string;
  dueAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  checkoutUrl: string | null;
  client: { id: string; name: string };
  lines: { description: string; amount: number }[];
};

const filters: { id: "all" | "DRAFT" | "SENT" | "PAID" | "VOID" | "overdue"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "SENT", label: "Sent" },
  { id: "overdue", label: "Overdue" },
  { id: "PAID", label: "Paid" },
  { id: "VOID", label: "Void" },
];

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { client: { select: { id: true, name: true } }, lines: { orderBy: { sortOrder: "asc" }, select: { description: true, amount: true } } },
    }),
    prisma.client.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const raw = typeof ctx.query.filter === "string" ? ctx.query.filter : "all";
  const filter = (filters.some((f) => f.id === raw) ? raw : "all") as (typeof filters)[number]["id"];
  return { props: JSON.parse(JSON.stringify({ invoices, clients, filter })) };
};

export default function InvoicesPage({
  invoices,
  clients,
  filter: initialFilter,
}: {
  invoices: InvoiceRow[];
  clients: { id: string; name: string }[];
  filter: (typeof filters)[number]["id"];
}) {
  const router = useRouter();
  const refresh = () => router.replace(router.asPath, undefined, { scroll: false });
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [busy, setBusy] = useState<"last" | "current" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>(initialFilter);
  const [viewClient, setViewClient] = useState("all");

  const rows = useMemo(() => {
    return invoices.filter((inv) => {
      if (viewClient !== "all" && inv.client.id !== viewClient) return false;
      if (filter === "overdue") return Boolean(dueLabel(inv.dueAt, inv.status)?.overdue);
      if (filter !== "all") return inv.status === filter;
      return true;
    });
  }, [invoices, filter, viewClient]);

  const generate = async (periodOffset: -1 | 0) => {
    setBusy(periodOffset === 0 ? "current" : "last");
    setError(null);
    try {
      await api("/api/admin/invoices", { body: { kind: "PERIOD", clientId, periodOffset } });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminShell
      title="Invoices"
      wide
      actions={
        clients.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2 text-base sm:text-sm min-h-[44px] sm:min-h-0"
              aria-label="Client to invoice"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button onClick={() => generate(-1)} disabled={!!busy || !clientId}>
              {busy === "last" ? "Generating…" : "Draft last period"}
            </Button>
            <Button variant="ghost" onClick={() => generate(0)} disabled={!!busy || !clientId}>
              {busy === "current" ? "Generating…" : "Draft this period"}
            </Button>
          </div>
        )
      }
    >
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {invoices.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row gap-3">
          <select
            value={viewClient}
            onChange={(e) => setViewClient(e.target.value)}
            className="rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2 text-base sm:text-sm min-h-[44px] sm:min-h-0 sm:max-w-xs"
            aria-label="Filter by client"
          >
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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

      {invoices.length === 0 ? (
        <Card className="text-fun-gray-light">No invoices yet. Draft a period for a client, or mark a build payment stage as reached.</Card>
      ) : rows.length === 0 ? (
        <Card className="text-fun-gray-light">Nothing matches that filter.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((inv) => {
            const due = dueLabel(inv.dueAt, inv.status);
            return (
              <article key={inv.id} className="rounded-2xl border border-fun-gray-darker p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">
                      <Link href={`/admin/invoices/${inv.id}`} className="hover:text-fun-pink">
                        {inv.number}
                      </Link>
                      <span className="ml-2 text-xs font-normal text-fun-gray-medium">{inv.kind === "STAGE" ? "Build stage" : "Period"}</span>
                    </p>
                    <Link href={`/admin/clients/${inv.client.id}`} className="text-sm text-fun-pink hover:underline">
                      {inv.client.name}
                    </Link>
                    {due && <p className={`text-xs mt-1 ${due.overdue ? "text-red-300" : "text-fun-gray-medium"}`}>{due.text}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-monospace text-lg">{formatMoney(inv.total, inv.currency)}</p>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs ${invoiceStatusTone(inv.status)}`}>
                      {inv.status.toLowerCase()}
                    </span>
                  </div>
                </div>
                <ul className="mt-3 text-sm text-fun-gray-light space-y-1">
                  {inv.lines.map((l, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{l.description}</span>
                      <span className="font-monospace shrink-0">{formatMoney(l.amount, inv.currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <InvoiceActions invoice={inv} onDone={refresh} onError={setError} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
