-- Historical data: Chapter 2 Dating Ltd and the invoices already issued to them (INV-001, INV-003).
-- Invoices keep their original numbers; the generator's own INV-YYYY-NNNN series is unaffected.
-- Safe to re-run: every insert is skipped if the row (or invoice number) already exists.
-- Billing email is a placeholder so reminders never reach a stranger; replace it in /admin/clients.

INSERT INTO "Client" ("id", "name", "billingEmail", "currency", "hourlyRate", "periodStartDay", "vatRateBps", "createdAt", "updatedAt")
VALUES ('client_chapter2_dating', 'Chapter 2 Dating Ltd', 'me@harrisonwarburton.com', 'GBP', 3750, 1, 0, '2026-09-14 00:00:00', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- INV-001 · 14–30 Sep 2026 · 22h 00m @ £37.50 = £825.00 · paid
INSERT INTO "Invoice" ("id", "clientId", "number", "kind", "status", "periodStart", "periodEnd", "currency", "subtotal", "vatRateBps", "vat", "total", "dueAt", "sentAt", "paidAt", "createdAt", "updatedAt")
SELECT 'inv_chapter2_001', 'client_chapter2_dating', 'INV-001', 'PERIOD', 'PAID', '2026-09-14 00:00:00', '2026-10-01 00:00:00', 'GBP', 82500, 0, 0, 82500, '2026-10-19 00:00:00', '2026-10-05 00:00:00', '2026-10-19 00:00:00', '2026-10-05 00:00:00', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Invoice" WHERE "number" = 'INV-001');

INSERT INTO "InvoiceLine" ("id", "invoiceId", "description", "minutes", "rate", "amount", "sortOrder")
SELECT 'invline_chapter2_001_1', 'inv_chapter2_001', 'Web development, platform updates and support', 1320, 3750, 82500, 0
WHERE EXISTS (SELECT 1 FROM "Invoice" WHERE "id" = 'inv_chapter2_001')
  AND NOT EXISTS (SELECT 1 FROM "InvoiceLine" WHERE "id" = 'invline_chapter2_001_1');

-- INV-003 · 1–31 Oct 2026 · 40h 00m billed (66h worked against a 40h quote) @ £37.50 = £1,500.00 · sent
INSERT INTO "Invoice" ("id", "clientId", "number", "kind", "status", "periodStart", "periodEnd", "currency", "subtotal", "vatRateBps", "vat", "total", "dueAt", "sentAt", "createdAt", "updatedAt")
SELECT 'inv_chapter2_003', 'client_chapter2_dating', 'INV-003', 'PERIOD', 'SENT', '2026-10-01 00:00:00', '2026-11-01 00:00:00', 'GBP', 150000, 0, 0, 150000, '2026-11-14 00:00:00', '2026-10-31 00:00:00', '2026-10-31 00:00:00', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Invoice" WHERE "number" = 'INV-003');

INSERT INTO "InvoiceLine" ("id", "invoiceId", "description", "minutes", "rate", "amount", "sortOrder")
SELECT 'invline_chapter2_003_1', 'inv_chapter2_003', 'Web development, platform updates and support (quoted 40h; 66h worked)', 2400, 3750, 150000, 0
WHERE EXISTS (SELECT 1 FROM "Invoice" WHERE "id" = 'inv_chapter2_003')
  AND NOT EXISTS (SELECT 1 FROM "InvoiceLine" WHERE "id" = 'invline_chapter2_003_1');
