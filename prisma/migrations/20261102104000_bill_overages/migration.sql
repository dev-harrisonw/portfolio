-- Existing retainers already charge overage, so the default keeps current behaviour.
ALTER TABLE "Client" ADD COLUMN "billOverages" BOOLEAN NOT NULL DEFAULT true;

-- Chapter 2 Dating's quote covers the retainer only; extra hours are tracked but not charged.
UPDATE "Client" SET "billOverages" = false WHERE lower(trim("name")) like 'chapter 2 dating%';
