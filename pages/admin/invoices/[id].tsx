import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { formatMoney } from "@/lib/billing";
import { getClientUsage } from "@/lib/usage";
import { priceUsage } from "@/lib/invoicing/calc";
import { syncClientDrafts } from "@/lib/invoicing/syncDraft";
import { dueLabel, invoiceStatusTone } from "@/lib/clients";
import AdminShell from "@/components/admin/AdminShell";
import InvoiceActions, { type InvoiceActionStatus } from "@/components/admin/InvoiceActions";
import InvoiceLines from "@/components/admin/InvoiceLines";
import InvoiceName from "@/components/admin/InvoiceName";
import InvoiceOverage from "@/components/admin/InvoiceOverage";
import InvoiceTime from "@/components/admin/InvoiceTime";
import { Card } from "@/components/admin/Form";
import type { PickerClient } from "@/components/admin/time/TaskPicker";

type InvoiceDetail = {
  id: string;
  number: string;
  kind: "PERIOD" | "STAGE";
  status: InvoiceActionStatus;
  currency: string;
  subtotal: number;
  vatRateBps: number;
  vat: number;
  total: number;
  billOverages: boolean;
  dueAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  client: { id: string; name: string; billingEmail: string };
  project: { id: string; name: string } | null;
  lines: { id: string; description: string; detail: string; minutes: number; rate: number; amount: number }[];
  entries: { id: string; durationMinutes: number; amount: number | null; note: string; startedAt: string; task: { title: string } }[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const invoiceId = String(ctx.params?.id);
  const head = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { clientId: true, status: true, kind: true } });
  if (head?.status === "DRAFT" && head.kind === "PERIOD") await syncClientDrafts(head.clientId);
  const invoice = await prisma.invoice.findUnique({
    where: { id: String(ctx.params?.id) },
    include: {
      client: { select: { id: true, name: true, billingEmail: true } },
      project: { select: { id: true, name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      entries: {
        orderBy: { startedAt: "asc" },
        select: { id: true, durationMinutes: true, amount: true, note: true, startedAt: true, task: { select: { title: true } } },
      },
    },
  });
  if (!invoice) return { notFound: true };
  const withheld =
    invoice.kind === "PERIOD" && invoice.periodStart && invoice.periodEnd
      ? await prisma.timeEntry.findMany({
          where: {
            withheld: true,
            endedAt: { not: null },
            startedAt: { gte: invoice.periodStart, lt: invoice.periodEnd },
            task: { project: { clientId: invoice.clientId, billingType: "TIME" } },
          },
          orderBy: { startedAt: "asc" },
          select: { id: true, durationMinutes: true, amount: true, note: true, startedAt: true, task: { select: { title: true } } },
        })
      : [];
  let overageMinutes = 0;
  let overageAmount = 0;
  if (invoice.kind === "PERIOD" && invoice.periodStart && invoice.periodEnd) {
    const usage = await getClientUsage(invoice.clientId, { start: invoice.periodStart, end: invoice.periodEnd }, new Date(invoice.periodEnd.getTime() - 1));
    if (usage) {
      const onInvoice = new Set(invoice.entries.map((entry) => entry.id));
      const priced = priceUsage(
        { ...usage, entries: usage.entries.filter((entry) => onInvoice.has(entry.id)) },
        { billOverages: true }
      );
      overageMinutes = priced.overageMinutes;
      overageAmount = priced.overageAmount;
    }
  }
  const projects = await prisma.project.findMany({
    where: { clientId: invoice.clientId, status: { not: "ARCHIVED" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, tasks: { orderBy: { title: "asc" }, select: { id: true, title: true, status: true } } },
  });
  const picker: PickerClient[] = [{ id: invoice.client.id, name: invoice.client.name, projects }];
  return { props: JSON.parse(JSON.stringify({ invoice, picker, withheld, overageMinutes, overageAmount })) };
};

export default function InvoiceDetailPage({
  invoice,
  picker,
  withheld,
  overageMinutes,
  overageAmount,
}: {
  invoice: InvoiceDetail;
  picker: PickerClient[];
  withheld: InvoiceDetail["entries"];
  overageMinutes: number;
  overageAmount: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const due = dueLabel(invoice.dueAt, invoice.status);
  const period =
    invoice.periodStart && invoice.periodEnd
      ? `${fmt(invoice.periodStart)} – ${fmt(new Date(new Date(invoice.periodEnd).getTime() - 86400000).toISOString())}`
      : invoice.kind === "STAGE"
        ? "Project payment"
        : "Invoice";

  return (
    <AdminShell
      eyebrow="Invoice"
      title={invoice.number}
      heading={
        <InvoiceName
          id={invoice.id}
          number={invoice.number}
          onSaved={() => router.replace(router.asPath, undefined, { scroll: false })}
          onError={setError}
        />
      }
      wide
      actions={
        <InvoiceActions
          invoice={invoice}
          onDone={() => router.replace(router.asPath, undefined, { scroll: false })}
          onDeleted={() => router.push("/admin/invoices")}
          onError={setError}
        />
      }
    >
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className={`rounded-full px-3 py-1 text-xs uppercase ${invoiceStatusTone(invoice.status)}`}>{invoice.status.toLowerCase()}</span>
        <span className="text-sm text-fun-gray-medium">{invoice.kind === "STAGE" ? "Build stage" : "Period"}</span>
        {due && <span className={`text-sm ${due.overdue ? "text-red-300" : "text-fun-gray-medium"}`}>{due.text}</span>}
      </div>

      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-8">
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Client</p>
          <Link href={`/admin/clients/${invoice.client.id}`} className="block font-bold mt-1 text-fun-pink hover:underline truncate">
            {invoice.client.name}
          </Link>
          <p className="text-xs text-fun-gray-medium mt-1 truncate">{invoice.client.billingEmail}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Covering</p>
          <p className="font-bold mt-1 leading-snug">{period}</p>
          {invoice.project && <p className="text-xs text-fun-gray-medium mt-1">{invoice.project.name}</p>}
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Sent</p>
          <p className="font-bold mt-1 font-monospace">{fmt(invoice.sentAt)}</p>
          <p className="text-xs text-fun-gray-medium mt-1">Paid {fmt(invoice.paidAt)}</p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase tracking-wider text-fun-gray-light">Total</p>
          <p className="text-xl font-bold mt-1 font-monospace">{formatMoney(invoice.total, invoice.currency)}</p>
          {invoice.vat > 0 && (
            <p className="text-xs text-fun-gray-medium mt-1">inc. {formatMoney(invoice.vat, invoice.currency)} VAT</p>
          )}
        </Card>
      </div>

      {overageMinutes > 0 && (
        <InvoiceOverage
          invoiceId={invoice.id}
          currency={invoice.currency}
          billOverages={invoice.billOverages}
          overageMinutes={overageMinutes}
          overageAmount={overageAmount}
          editable={invoice.status === "DRAFT"}
          onChange={() => {
            setError(null);
            router.replace(router.asPath, undefined, { scroll: false });
          }}
          onError={setError}
        />
      )}

      <section className="mb-6 sm:mb-10">
        <h2 className="text-xl font-bold mb-4">Lines</h2>
        {invoice.status !== "DRAFT" && (
          <p className="text-xs text-fun-gray-medium mb-3">Lines can be changed while the invoice is still a draft.</p>
        )}
        <InvoiceLines
          invoiceId={invoice.id}
          currency={invoice.currency}
          lines={invoice.lines}
          subtotal={invoice.subtotal}
          vat={invoice.vat}
          vatRateBps={invoice.vatRateBps}
          total={invoice.total}
          editable={invoice.status === "DRAFT"}
          onChange={() => {
            setError(null);
            router.replace(router.asPath, undefined, { scroll: false });
          }}
          onError={setError}
        />
      </section>

      {(invoice.kind === "PERIOD" || invoice.entries.length > 0) && (
        <InvoiceTime
          invoiceId={invoice.id}
          currency={invoice.currency}
          editable={invoice.status === "DRAFT"}
          periodStart={invoice.periodStart}
          periodEnd={invoice.periodEnd}
          entries={invoice.entries}
          withheld={withheld}
          clients={picker}
          onChange={() => {
            setError(null);
            router.replace(router.asPath, undefined, { scroll: false });
          }}
          onError={setError}
        />
      )}
    </AdminShell>
  );
}
