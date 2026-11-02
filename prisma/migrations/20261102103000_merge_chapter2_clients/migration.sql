-- The seed in 20261102100000 created "Chapter 2 Dating Ltd" without knowing a real "Chapter 2 Dating"
-- client (with the 40h retainer) already existed. Move the seeded invoices onto the real client and
-- drop the duplicate. Does nothing if there is no other Chapter 2 Dating client.
DO $$
DECLARE
  target text;
BEGIN
  SELECT "id" INTO target
  FROM "Client"
  WHERE "id" <> 'client_chapter2_dating' AND lower(trim("name")) = 'chapter 2 dating'
  ORDER BY "createdAt"
  LIMIT 1;

  IF target IS NOT NULL AND EXISTS (SELECT 1 FROM "Client" WHERE "id" = 'client_chapter2_dating') THEN
    UPDATE "Invoice" SET "clientId" = target, "updatedAt" = CURRENT_TIMESTAMP WHERE "clientId" = 'client_chapter2_dating';
    DELETE FROM "Client" WHERE "id" = 'client_chapter2_dating';
  END IF;
END $$;
