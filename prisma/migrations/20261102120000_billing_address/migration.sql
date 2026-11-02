ALTER TABLE "Client" ADD COLUMN "billingAddress" TEXT;

UPDATE "Client"
SET "billingAddress" = E'FAO Nicky Wake\nSuite 21, Hardmans Business Centre\nNew Hall Hey Road\nRawtenstall BB4 6HH\nCompany no. 14082950'
WHERE lower(trim("name")) LIKE 'chapter 2 dating%';
