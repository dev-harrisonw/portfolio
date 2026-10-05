import { roundMinutes } from "@/lib/billing";
import type { ClientUsage } from "@/lib/usage";

function cell(value: string | number | boolean) {
  const s = String(value);
  // Leading =,+,-,@ would be evaluated as a formula by spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: (string | number | boolean)[][]) {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export const ENTRY_HEADER = ["Date", "Client", "Project", "Task", "Note", "Hours", "Minutes", "Billable", "Rate", "Amount", "Currency"];

/** One row per entry; rate/amount use rounding and project rate overrides (retainer cover is not netted off). */
export function usageRows(usage: ClientUsage) {
  const rates = new Map(usage.projects.map((p) => [p.id, p.hourlyRate ?? usage.client.hourlyRate]));
  return usage.entries.map((e) => {
    const minutes = e.billable ? roundMinutes(e.durationMinutes, usage.client.roundingMinutes) : e.durationMinutes;
    const rate = rates.get(e.projectId) ?? usage.client.hourlyRate;
    return [
      e.startedAt.slice(0, 10),
      usage.client.name,
      e.projectName,
      e.taskTitle,
      e.note,
      (minutes / 60).toFixed(2),
      minutes,
      e.billable ? "yes" : "no",
      (rate / 100).toFixed(2),
      e.billable ? ((minutes * rate) / 6000).toFixed(2) : "0.00",
      usage.client.currency,
    ];
  });
}

export function exportFilename(clientName: string, periodStart: string, ext: string) {
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug}-${periodStart.slice(0, 7)}-timesheet.${ext}`;
}
