import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatMinutes, formatMoney } from "@/lib/billing";

const green = "#3BB143";
const muted = "#6b7280";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  accent: { color: green },
  muted: { color: muted },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6 },
  row: { flexDirection: "row", paddingVertical: 5, borderBottom: "0.5pt solid #e5e7eb" },
  th: { flexDirection: "row", paddingBottom: 4, borderBottom: "1pt solid #111827", fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 7,
    color: muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export type InvoicePdfData = {
  number: string;
  kind: "PERIOD" | "STAGE";
  status: string;
  currency: string;
  subtotal: number;
  vatRateBps: number;
  vat: number;
  total: number;
  dueAt: string | Date | null;
  periodStart: string | Date | null;
  periodEnd: string | Date | null;
  createdAt: string | Date;
  client: { name: string; billingEmail: string };
  lines: { description: string; minutes: number; amount: number }[];
};

const fmtDate = (value: string | Date | null | undefined) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

function periodLabel(inv: InvoicePdfData) {
  if (!inv.periodStart || !inv.periodEnd) return inv.kind === "STAGE" ? "Project payment" : "Invoice";
  const end = new Date(new Date(inv.periodEnd).getTime() - 86400000);
  return `${fmtDate(inv.periodStart)} – ${end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })}`;
}

function InvoiceDoc({ invoice }: { invoice: InvoicePdfData }) {
  return (
    <Document title={`${invoice.number} · ${invoice.client.name}`} author="Harrison Warburton">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              Harrison Warburton<Text style={s.accent}>.</Text>
            </Text>
            <Text style={s.muted}>Invoice {invoice.number}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{invoice.client.name}</Text>
            <Text style={s.muted}>{invoice.client.billingEmail}</Text>
            <Text style={s.muted}>{periodLabel(invoice)}</Text>
            {invoice.dueAt ? <Text style={s.muted}>Due {fmtDate(invoice.dueAt)}</Text> : null}
          </View>
        </View>

        <View style={s.th}>
          <Text style={{ flex: 1 }}>Description</Text>
          <Text style={[s.right, { width: 70 }]}>Time</Text>
          <Text style={[s.right, { width: 80 }]}>Amount</Text>
        </View>
        {invoice.lines.map((line, i) => (
          <View key={i} style={s.row} wrap={false}>
            <Text style={{ flex: 1 }}>{line.description}</Text>
            <Text style={[s.right, s.muted, { width: 70 }]}>{line.minutes ? formatMinutes(line.minutes) : "—"}</Text>
            <Text style={[s.right, { width: 80 }]}>{formatMoney(line.amount, invoice.currency)}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{formatMoney(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.vat > 0 && (
            <View style={s.totalRow}>
              <Text style={s.muted}>VAT ({(invoice.vatRateBps / 100).toFixed(1)}%)</Text>
              <Text>{formatMoney(invoice.vat, invoice.currency)}</Text>
            </View>
          )}
          <View style={[s.totalRow, { borderTop: "1pt solid #111827", paddingTop: 6, marginTop: 4 }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{formatMoney(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        <Text style={[s.h2, { marginTop: 28 }]}>Pay online</Text>
        <Text style={s.muted}>
          Open the client portal at harrisonwarburton.com/portal to pay this invoice by card. Status: {invoice.status.toLowerCase()}.
        </Text>

        <View style={s.footer} fixed>
          <Text>harrisonwarburton.com</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(invoice: InvoicePdfData) {
  return renderToBuffer(<InvoiceDoc invoice={invoice} />);
}
