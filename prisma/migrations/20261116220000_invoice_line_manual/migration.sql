-- Lines added by hand survive a draft being refreshed from logged time.
ALTER TABLE "InvoiceLine" ADD COLUMN "manual" BOOLEAN NOT NULL DEFAULT false;
