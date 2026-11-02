import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import "@/lib/exports/pdfkitFonts";
import prisma from "@/lib/prisma";
import { formatMinutes, formatMoney } from "@/lib/billing";

const green = "#3BB143";
const pale = "#E7F6EA";
const ink = "#1a1a1a";
const muted = "#6b7280";
const line = "#e5e7eb";

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, fontSize: 9, fontFamily: "Helvetica", color: ink },
  brandMark: { fontSize: 16, fontFamily: "Helvetica-Bold", lineHeight: 1.15 },
  green: { color: green },
  rule: { height: 3, backgroundColor: green, marginTop: 8, marginBottom: 16 },
  hairline: { height: 0.6, backgroundColor: line, marginTop: 8, marginBottom: 14 },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: green, letterSpacing: 0.6, marginBottom: 3 },
  muted: { color: muted },
  right: { textAlign: "right" },
  box: { flex: 1, borderWidth: 0.6, borderColor: line, padding: 10 },
  th: { flexDirection: "row", backgroundColor: pale, paddingVertical: 5, paddingHorizontal: 8 },
  thText: { fontFamily: "Helvetica-Bold", color: green, fontSize: 8 },
  row: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.4, borderBottomColor: line },
  panel: { flex: 1, backgroundColor: pale, padding: 12 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8 },
});

export type InvoicePdfData = {
  id?: string;
  clientId?: string;
  number: string;
  kind: "PERIOD" | "STAGE";
  status: string;
  currency: string;
  subtotal: number;
  vatRateBps: number;
  vat: number;
  total: number;
  dueAt: string | Date | null;
  sentAt?: string | Date | null;
  periodStart: string | Date | null;
  periodEnd: string | Date | null;
  createdAt: string | Date;
  client: {
    name: string;
    billingEmail: string;
    billingAddress?: string | null;
    hourlyRate?: number;
    monthlyHours?: number | null;
    billOverages?: boolean;
  };
  lines: { description: string; minutes: number; rate?: number; amount: number }[];
};

type Detail = { note: string; minutes: number };
type Area = { title: string; status: string; minutes: number; details: Detail[] };

const longDate = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

const monthName = (value: string | Date) => new Date(value).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });

function periodLabel(inv: InvoicePdfData) {
  if (!inv.periodStart || !inv.periodEnd) return inv.kind === "STAGE" ? "Project payment" : "";
  const end = new Date(new Date(inv.periodEnd).getTime() - 86400000);
  return `${longDate(inv.periodStart)} – ${longDate(end)}`;
}

function invoiceDate(inv: InvoicePdfData) {
  return longDate(inv.sentAt || inv.createdAt);
}

function dueInDays(inv: InvoicePdfData) {
  if (!inv.dueAt) return null;
  const from = new Date(inv.sentAt || inv.createdAt).getTime();
  const days = Math.round((new Date(inv.dueAt).getTime() - from) / 86400000);
  if (days <= 0) return null;
  return `${days} day${days === 1 ? "" : "s"} from invoice date`;
}

async function loadWork(invoice: InvoicePdfData): Promise<Area[]> {
  if (!invoice.clientId || !invoice.periodStart || !invoice.periodEnd) return [];
  const entries = await prisma.timeEntry.findMany({
    where: {
      endedAt: { not: null },
      startedAt: { gte: new Date(invoice.periodStart), lt: new Date(invoice.periodEnd) },
      task: { project: { clientId: invoice.clientId } },
    },
    orderBy: { startedAt: "asc" },
    include: { task: { select: { title: true, status: true } } },
  });
  const areas: Area[] = [];
  for (const entry of entries) {
    let area = areas.find((a) => a.title === entry.task.title);
    if (!area) {
      area = { title: entry.task.title, status: entry.task.status, minutes: 0, details: [] };
      areas.push(area);
    }
    area.minutes += entry.durationMinutes;
    const note = entry.note.trim();
    const detail = area.details.find((d) => d.note === note);
    if (detail) detail.minutes += entry.durationMinutes;
    else area.details.push({ note, minutes: entry.durationMinutes });
  }
  return areas;
}

function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>
        Harrison <Text style={s.green}>Warburton</Text>
      </Text>
    );
  }
  return (
    <View>
      <Text style={s.brandMark}>Harrison</Text>
      <Text style={[s.brandMark, s.green]}>Warburton</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.green}>harrisonwarburton.com</Text>
      <Text style={s.muted} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function RunningHeader({ invoice }: { invoice: InvoicePdfData }) {
  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Brand compact />
        <View style={{ alignItems: "flex-end" }}>
          <Text>{invoice.number}</Text>
          <Text style={s.muted}>{invoiceDate(invoice)}</Text>
        </View>
      </View>
      <View style={s.hairline} />
    </View>
  );
}

function Cover({ invoice, rate }: { invoice: InvoicePdfData; rate: number }) {
  const period = periodLabel(invoice);
  const address = (invoice.client.billingAddress || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const days = dueInDays(invoice);
  return (
    <Page size="A4" style={s.page}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Brand />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.muted}>me@harrisonwarburton.com</Text>
          <Text style={s.muted}>harrisonwarburton.com</Text>
        </View>
      </View>
      <View style={s.rule} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
        <View>
          <Text style={s.label}>INVOICE</Text>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold" }}>{invoice.number}</Text>
          {period ? <Text style={{ marginTop: 3 }}>Work period: {period}</Text> : null}
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text>Invoice no. {invoice.number}</Text>
          <Text>Invoice date</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{invoiceDate(invoice)}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <View style={[s.box, { marginRight: 8 }]}>
          <Text style={s.label}>FROM</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>Harrison Warburton</Text>
          <Text>17 Stewart Street</Text>
          <Text>Bury BL8 1SU</Text>
          <Text>me@harrisonwarburton.com</Text>
        </View>
        <View style={s.box}>
          <Text style={s.label}>BILL TO</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{invoice.client.name}</Text>
          {address.map((l) => (
            <Text key={l}>{l}</Text>
          ))}
          {!address.length && <Text>{invoice.client.billingEmail}</Text>}
        </View>
      </View>

      <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>Invoice summary</Text>
      <View style={s.th}>
        <Text style={[s.thText, { flex: 1 }]}>Description</Text>
        <Text style={[s.thText, s.right, { width: 70 }]}>Hours</Text>
        <Text style={[s.thText, s.right, { width: 60 }]}>Rate</Text>
        <Text style={[s.thText, s.right, { width: 70 }]}>Amount</Text>
      </View>
      {invoice.lines.map((row, i) => (
        <View key={i} style={s.row} wrap={false}>
          <Text style={{ flex: 1 }}>{row.description}</Text>
          <Text style={[s.right, { width: 70 }]}>{row.minutes ? formatMinutes(row.minutes) : "—"}</Text>
          <Text style={[s.right, { width: 60 }]}>{row.rate || rate ? formatMoney(row.rate || rate, invoice.currency) : "—"}</Text>
          <Text style={[s.right, { width: 70 }]}>{formatMoney(row.amount, invoice.currency)}</Text>
        </View>
      ))}

      <View style={{ flexDirection: "row", marginTop: 14 }}>
        <View style={[s.panel, { marginRight: 8 }]}>
          <Text style={s.label}>AMOUNT DUE</Text>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: green, marginTop: 2 }}>{formatMoney(invoice.total, invoice.currency)}</Text>
          {invoice.vat > 0 && (
            <Text style={[s.muted, { marginTop: 3 }]}>
              Includes VAT {formatMoney(invoice.vat, invoice.currency)} ({(invoice.vatRateBps / 100).toFixed(0)}%)
            </Text>
          )}
        </View>
        <View style={s.panel}>
          <Text style={s.label}>PAYMENT DUE</Text>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 6 }}>{invoice.dueAt ? longDate(invoice.dueAt) : "On receipt"}</Text>
          {days ? <Text style={s.muted}>{days}</Text> : null}
        </View>
      </View>

      <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 8 }}>Payment details</Text>
      {[
        ["Account name", "Harrison Warburton"],
        ["Sort code", "23-01-63"],
        ["Account number", "35446741"],
        ["Payment reference", invoice.number],
      ].map(([name, value]) => (
        <View key={name} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={[s.muted, { width: 120 }]}>{name}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{value}</Text>
        </View>
      ))}
      {invoice.vat === 0 && <Text style={[s.muted, { marginTop: 6 }]}>Not VAT registered</Text>}
      <Text style={[s.muted, { marginTop: 8 }]}>Or pay by card at harrisonwarburton.com/portal.</Text>
      <Footer />
    </Page>
  );
}

function Breakdown({ invoice, areas }: { invoice: InvoicePdfData; areas: Area[] }) {
  const worked = areas.reduce((sum, a) => sum + a.minutes, 0);
  const period = periodLabel(invoice);
  return (
    <Page size="A4" style={s.page}>
      <RunningHeader invoice={invoice} />
      <Text style={s.h1}>Work completed</Text>
      {period ? <Text style={[s.muted, { marginBottom: 10 }]}>Breakdown of work completed during {period}.</Text> : null}
      <View style={s.th}>
        <Text style={[s.thText, { width: 130 }]}>Work area</Text>
        <Text style={[s.thText, { flex: 1 }]}>Details</Text>
        <Text style={[s.thText, s.right, { width: 90 }]}>Hours</Text>
      </View>
      {areas.map((area) => (
        <View key={area.title} style={{ flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: line, paddingVertical: 6, paddingHorizontal: 8 }} wrap={false}>
          <View style={{ width: 130, paddingRight: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{area.title}</Text>
            {area.status !== "DONE" && <Text style={[s.muted, { fontSize: 8 }]}>Not finished</Text>}
          </View>
          <View style={{ flex: 1 }}>
            {area.details.map((d, i) => (
              <Text key={i} style={{ marginBottom: 1 }}>{d.note || area.title}</Text>
            ))}
          </View>
          <View style={{ width: 90, alignItems: "flex-end" }}>
            {area.details.length > 1 &&
              area.details.map((d, i) => (
                <Text key={i} style={[s.muted, { marginBottom: 1 }]}>{formatMinutes(d.minutes)}</Text>
              ))}
            <Text style={{ fontFamily: "Helvetica-Bold", color: green, marginTop: area.details.length > 1 ? 2 : 0 }}>{formatMinutes(area.minutes)}</Text>
          </View>
        </View>
      ))}
      <View style={[s.th, { marginTop: 4 }]}>
        <Text style={[s.thText, { flex: 1 }]}>Total worked</Text>
        <Text style={[s.thText, s.right]}>{formatMinutes(worked)}</Text>
      </View>
      <Footer />
    </Page>
  );
}

function Quote({ invoice, areas }: { invoice: InvoicePdfData; areas: Area[] }) {
  const quoted = (invoice.client.monthlyHours ?? 0) * 60;
  const worked = areas.reduce((sum, a) => sum + a.minutes, 0);
  const billed = Math.min(worked, quoted);
  const over = Math.max(0, worked - quoted);
  const admin = areas.filter((a) => a.title.trim().toLowerCase() === "admin");
  const done = areas.filter((a) => a.status === "DONE" && !admin.includes(a));
  const open = areas.filter((a) => a.status !== "DONE");
  const sum = (list: Area[]) => list.reduce((n, a) => n + a.minutes, 0);
  const month = invoice.periodStart ? monthName(invoice.periodStart) : "the period";
  const rows: { label: string; note?: string; minutes: number }[] = [];
  if (done.length) rows.push({ label: "Completed", minutes: sum(done) });
  for (const area of open) rows.push({ label: area.title, note: "not finished", minutes: area.minutes });
  for (const area of admin) rows.push({ label: "Admin", note: area.details.map((d) => d.note).filter(Boolean).join("; "), minutes: area.minutes });

  return (
    <Page size="A4" style={s.page}>
      <RunningHeader invoice={invoice} />
      <Text style={s.h1}>Hours against quote</Text>
      <Text style={[s.muted, { marginBottom: 10 }]}>
        The quote for {month} was {formatMinutes(quoted)}. {formatMinutes(worked)} were worked; this invoice bills the quoted {formatMinutes(billed)}.
      </Text>
      <View style={{ flexDirection: "row", marginBottom: 14 }}>
        {[
          ["QUOTED", formatMinutes(quoted), "Agreed quote for the month"],
          ["WORKED", formatMinutes(worked), over ? `${formatMinutes(over)} over the quote, not charged` : "Within the quote"],
          ["BILLED", formatMinutes(billed), "Charged on this invoice"],
        ].map(([k, v, n], i) => (
          <View key={k} style={[s.panel, i < 2 ? { marginRight: 8 } : {}]}>
            <Text style={s.label}>{k}</Text>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>{v}</Text>
            <Text style={s.muted}>{n}</Text>
          </View>
        ))}
      </View>
      <View style={s.th}>
        <Text style={[s.thText, { flex: 1 }]}>Status</Text>
        <Text style={[s.thText, s.right]}>Hours</Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={s.row}>
          <Text style={{ flex: 1 }}>
            {row.label}
            {row.note ? <Text style={s.muted}> · {row.note}</Text> : null}
          </Text>
          <Text>{formatMinutes(row.minutes)}</Text>
        </View>
      ))}
      <Footer />
    </Page>
  );
}

function InvoiceDoc({ invoice, areas }: { invoice: InvoicePdfData; areas: Area[] }) {
  const rate = invoice.client.hourlyRate ?? 0;
  const worked = areas.reduce((sum, a) => sum + a.minutes, 0);
  const quoted = (invoice.client.monthlyHours ?? 0) * 60;
  const showQuote = quoted > 0 && worked > quoted && invoice.client.billOverages === false;
  return (
    <Document title={`${invoice.number} · ${invoice.client.name}`} author="Harrison Warburton">
      <Cover invoice={invoice} rate={rate} />
      {areas.length > 0 && <Breakdown invoice={invoice} areas={areas} />}
      {showQuote && <Quote invoice={invoice} areas={areas} />}
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoicePdfData, areas?: Area[]) {
  const work = areas ?? (await loadWork(invoice));
  return renderToBuffer(<InvoiceDoc invoice={invoice} areas={work} />);
}
