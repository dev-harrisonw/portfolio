import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { formatMinutes, formatMoney } from "@/lib/billing";
import { dueLabel, invoiceStatusTone } from "@/lib/clients";
import AdminShell from "@/components/admin/AdminShell";
import InvoiceActions, { type InvoiceActionStatus } from "@/components/admin/InvoiceActions";
import { Card } from "@/components/admin/Form";

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
  dueAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  checkoutUrl: string | null;
  createdAt: string;
  client: { id: string; name: string; billingEmail: string };
  project: { id: string; name: string } | null;
  lines: { id: string; description: string; minutes: number; amount: number }[];
  entries: { id: string; durationMinutes: number; note: string; startedAt: string; task: { title: string } }[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const invoice = await prisma.invoice.findUnique({
    where: { id: String(ctx.params?.id) },
    include: {
      client: { select: { id: true, name: true, billingEmail: true } },
      project: { select: { id: true, name: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      entries: {
        orderBy: { startedAt: "asc" },
        select: { id: true, durationMinutes: true, note: true, startedAt: true, task: { select: { title: true } } },
      },
    },
  });
  if (!invoice) return { notFound: true };
  return { props: JSON.parse(JSON.stringify({ invoice })) };
};

export default function InvoiceDetailPage({ invoice }: { invoice: InvoiceDetail }) {
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
      wide
      actions={
        <InvoiceActions
          invoice={invoice}
          onDone={() => router.replace(router.asPath, undefined, { scroll: false })}
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

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-8">
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

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Lines</h2>
        <Card>
          <ul className="divide-y divide-fun-gray-darker">
            {invoice.lines.map((line) => (
              <li key={line.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  {line.description}
                  {line.minutes > 0 && <span className="text-fun-gray-medium"> · {formatMinutes(line.minutes)}</span>}
                </span>
                <span className="font-monospace shrink-0">{formatMoney(line.amount, invoice.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-fun-gray-darker space-y-1 text-sm">
            <p className="flex justify-between text-fun-gray-medium">
              <span>Subtotal</span>
              <span className="font-monospace">{formatMoney(invoice.subtotal, invoice.currency)}</span>
            </p>
            {invoice.vat > 0 && (
              <p className="flex justify-between text-fun-gray-medium">
                <span>VAT ({(invoice.vatRateBps / 100).toFixed(1)}%)</span>
                <span className="font-monospace">{formatMoney(invoice.vat, invoice.currency)}</span>
              </p>
            )}
            <p className="flex justify-between font-bold">
              <span>Total</span>
              <span className="font-monospace">{formatMoney(invoice.total, invoice.currency)}</span>
            </p>
          </div>
        </Card>
      </section>

      {invoice.entries.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Time on this invoice</h2>
          <Card>
            <ul className="divide-y divide-fun-gray-darker">
              {invoice.entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-2.5 text-sm">
                  <span className="w-20 shrink-0 text-xs text-fun-gray-medium">{fmt(entry.startedAt)}</span>
                  <span className="flex-1 min-w-0">
                    {entry.task.title}
                    {entry.note && <span className="text-fun-gray-light"> — {entry.note}</span>}
                  </span>
                  <span className="font-monospace text-xs shrink-0">{formatMinutes(entry.durationMinutes)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </AdminShell>
  );
}
