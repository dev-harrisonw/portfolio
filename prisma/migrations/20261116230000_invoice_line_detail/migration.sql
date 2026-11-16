-- A note under an invoice line, shown to the client.
ALTER TABLE "InvoiceLine" ADD COLUMN "detail" TEXT NOT NULL DEFAULT '';
