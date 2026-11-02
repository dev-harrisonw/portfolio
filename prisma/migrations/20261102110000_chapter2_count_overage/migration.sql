-- The allowance only counts billable time. Marking the extra 26h non-billable hid them,
-- so October showed 38h used and 2h left instead of 26h over. Charging is controlled by
-- Client.billOverages, so every logged hour counts. Also drop 6h that was logged twice
-- on "Staff can reopen a closed account", and move the tail of October's work back into October.
UPDATE "TimeEntry" SET "billable" = true WHERE "id" LIKE 'te_c2_%';

DELETE FROM "TimeEntry" WHERE "id" IN ('te_c2_021', 'te_c2_022');

UPDATE "TimeEntry" SET "startedAt" = '2026-10-27 14:00:00', "endedAt" = '2026-10-27 16:00:00' WHERE "id" = 'te_c2_032';
UPDATE "TimeEntry" SET "startedAt" = '2026-10-28 14:00:00', "endedAt" = '2026-10-28 15:00:00' WHERE "id" = 'te_c2_033';
UPDATE "TimeEntry" SET "startedAt" = '2026-10-29 14:00:00', "endedAt" = '2026-10-29 20:00:00' WHERE "id" = 'te_c2_034';
UPDATE "TimeEntry" SET "startedAt" = '2026-10-30 14:00:00', "endedAt" = '2026-10-30 18:00:00' WHERE "id" = 'te_c2_035';

UPDATE "Task" SET "completedAt" = '2026-10-30 00:00:00' WHERE "id" = 'task_c2_dashboard';
