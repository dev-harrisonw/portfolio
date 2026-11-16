ALTER TABLE "Invoice" ADD COLUMN "billOverages" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Invoice" AS i
SET "billOverages" = c."billOverages"
FROM "Client" AS c
WHERE c.id = i."clientId";
