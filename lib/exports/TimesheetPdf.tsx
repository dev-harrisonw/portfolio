import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatMinutes, formatMoney } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";
import type { InvoiceDraft } from "@/lib/invoicing/calc";

const green = "#3BB143";
const muted = "#6b7280";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  accent: { color: green },
  muted: { color: muted },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6 },
  stats: { flexDirection: "row", gap: 10 },
  stat: { flex: 1, border: "1pt solid #e5e7eb", borderRadius: 4, padding: 8 },
  statLabel: { fontSize: 7, color: muted, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 3 },
  row: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5pt solid #e5e7eb" },
  th: { flexDirection: "row", paddingBottom: 4, borderBottom: "1pt solid #111827", fontFamily: "Helvetica-Bold" },
  right: { textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: muted, flexDirection: "row", justifyContent: "space-between" },
});

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function Timesheet({ usage, estimate }: { usage: ClientUsage; estimate: InvoiceDraft }) {
  const main = usage.allowances[0];
  const periodLabel = `${fmtDate(usage.period.start)} – ${new Date(new Date(usage.period.end).getTime() - 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;

  return (
    <Document title={`${usage.client.name} timesheet ${periodLabel}`} author="Harrison Warburton">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              Harrison Warburton<Text style={s.accent}>.</Text>
            </Text>
            <Text style={s.muted}>Timesheet</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{usage.client.name}</Text>
            <Text style={s.muted}>{periodLabel}</Text>
          </View>
        </View>

        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Billable hours</Text>
            <Text style={s.statValue}>{formatMinutes(usage.totals.billableMinutes)}</Text>
          </View>
          {main.availableMinutes != null && (
            <View style={s.stat}>
              <Text style={s.statLabel}>{main.overageMinutes > 0 ? "Over allowance" : "Remaining"}</Text>
              <Text style={s.statValue}>{formatMinutes(main.overageMinutes > 0 ? main.overageMinutes : main.remainingMinutes ?? 0)}</Text>
              <Text style={s.muted}>of {formatMinutes(main.availableMinutes)}{main.carriedInMinutes > 0 ? ` (incl. ${formatMinutes(main.carriedInMinutes)} rolled over)` : ""}</Text>
            </View>
          )}
          <View style={s.stat}>
            <Text style={s.statLabel}>{usage.period.isCurrent ? "Estimated" : "Amount"}</Text>
            <Text style={s.statValue}>{formatMoney(estimate.total, usage.client.currency)}</Text>
            {estimate.vat > 0 && <Text style={s.muted}>incl. VAT {formatMoney(estimate.vat, usage.client.currency)}</Text>}
          </View>
        </View>

        <Text style={s.h2}>By project</Text>
        {usage.byProject.map((p) => (
          <View key={p.projectId} wrap={false} style={{ marginBottom: 6 }}>
            <View style={[s.row, { borderBottom: "none" }]}>
              <Text style={{ flex: 1, fontFamily: "Helvetica-Bold" }}>{p.name}</Text>
              <Text style={s.right}>{formatMinutes(p.minutes)}</Text>
            </View>
            {p.tasks.map((t) => (
              <View key={t.taskId} style={[s.row, { paddingLeft: 10 }]}>
                <Text style={{ flex: 1 }}>
                  {t.title}
                  {t.status === "DONE" ? <Text style={s.accent}> (done)</Text> : null}
                </Text>
                <Text style={[s.right, s.muted]}>{formatMinutes(t.minutes)}</Text>
              </View>
            ))}
          </View>
        ))}

        {usage.completedTasks.length > 0 && (
          <>
            <Text style={s.h2}>Work completed</Text>
            {usage.completedTasks.map((t) => (
              <View key={t.id} style={s.row}>
                <Text style={{ flex: 1 }}>{t.title}</Text>
                <Text style={[s.muted, { width: 120 }]}>{t.projectName}</Text>
                <Text style={[s.muted, s.right, { width: 50 }]}>{fmtDate(t.completedAt)}</Text>
              </View>
            ))}
          </>
        )}

        <View wrap={false} minPresenceAhead={60}>
          <Text style={s.h2}>Time log</Text>
          <View style={s.th}>
            <Text style={{ width: 50 }}>Date</Text>
            <Text style={{ flex: 1 }}>Work</Text>
            <Text style={[s.right, { width: 50 }]}>Time</Text>
          </View>
        </View>
        {usage.entries.map((e) => (
          <View key={e.id} style={s.row} wrap={false}>
            <Text style={{ width: 50 }}>{fmtDate(e.startedAt)}</Text>
            <View style={{ flex: 1 }}>
              <Text>
                {e.taskTitle} <Text style={s.muted}>· {e.projectName}</Text>
              </Text>
              {e.note ? <Text style={s.muted}>{e.note}</Text> : null}
            </View>
            <Text style={[s.right, { width: 50 }]}>
              {formatMinutes(e.durationMinutes)}
              {e.billable ? "" : "*"}
            </Text>
          </View>
        ))}
        {usage.entries.some((e) => !e.billable) && <Text style={[s.muted, { marginTop: 4 }]}>* Not billed</Text>}

        <View style={s.footer} fixed>
          <Text>harrisonwarburton.com</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function renderTimesheetPdf(usage: ClientUsage, estimate: InvoiceDraft) {
  return renderToBuffer(<Timesheet usage={usage} estimate={estimate} />);
}
