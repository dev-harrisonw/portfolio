-- Backfill Chapter 2 Dating's logged work from the invoices already issued.
-- INV-001 (14–30 Sep 2026): 22h 00m, all billed.
-- INV-003 (1–31 Oct 2026): 66h 00m worked against a 40h quote, so the last 26h are logged but not billed.
-- Entries are spread across the working days of each period. Idempotent: skipped if the project exists.
DO $$
DECLARE
  client text;
  project text := 'proj_chapter2_platform';
BEGIN
  SELECT "id" INTO client FROM "Client" WHERE lower(trim("name")) like 'chapter 2 dating%' ORDER BY "createdAt" LIMIT 1;
  IF client IS NULL OR EXISTS (SELECT 1 FROM "Project" WHERE "id" = project) THEN RETURN; END IF;

  INSERT INTO "Project" ("id", "clientId", "name", "status", "billingType", "createdAt", "updatedAt")
  VALUES (project, client, 'Platform', 'ACTIVE', 'TIME', '2026-09-14 00:00:00', CURRENT_TIMESTAMP);

  INSERT INTO "Task" ("id", "projectId", "title", "status", "completedAt", "createdAt", "updatedAt") VALUES
    ('task_c2_yoti',       project, 'Yoti age verification',       'DONE', '2026-09-25 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_signup',     project, 'Sign-up form and tracking',   'DONE', '2026-09-30 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_discovery',  project, 'Discovery and setup',         'DONE', '2026-09-16 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_analytics',  project, 'Marketing analytics',         'DONE', '2026-09-24 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_planning',   project, 'Project planning',            'DONE', '2026-09-28 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_stripe',     project, 'Stripe compliance',           'DONE', '2026-09-29 00:00:00', '2026-09-14 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_webhooks',   project, 'Webhooks',                    'DONE', '2026-10-09 00:00:00', '2026-10-01 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_onboarding', project, 'Signup and onboarding',       'DONE', '2026-10-19 00:00:00', '2026-10-01 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_age',        project, 'Age verification',            'DONE', '2026-10-21 00:00:00', '2026-10-01 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_dashboard',  project, 'Dashboard',                   'DONE', '2026-10-27 00:00:00', '2026-10-01 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_appui',      project, 'App UI',                      'TODO', NULL,                  '2026-10-01 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_admin',      project, 'Admin',                       'DONE', '2026-10-30 00:00:00', '2026-10-01 00:00:00', CURRENT_TIMESTAMP);

  -- (task, start, minutes, billed). September totals 22h 00m, all billed.
  INSERT INTO "TimeEntry" ("id", "taskId", "startedAt", "endedAt", "durationMinutes", "note", "billable", "createdAt", "updatedAt") VALUES
    ('te_c2_001', 'task_c2_yoti',      '2026-09-14 09:00:00', '2026-09-14 13:00:00', 240, 'Yoti age verification integration (M14-250, M14-260, M14-261, M14-262) and user list follow-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_002', 'task_c2_yoti',      '2026-09-15 09:00:00', '2026-09-15 12:15:00', 195, 'Yoti age verification integration (M14-250, M14-260, M14-261, M14-262) and user list follow-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_003', 'task_c2_yoti',      '2026-09-16 09:00:00', '2026-09-16 10:30:00',  90, 'Yoti age verification integration (M14-250, M14-260, M14-261, M14-262) and user list follow-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_004', 'task_c2_signup',    '2026-09-17 09:00:00', '2026-09-17 13:00:00', 240, 'In-app sign-up form updates, sign-up form editor and sign-up tracking events (GA4 / Meta)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_005', 'task_c2_signup',    '2026-09-18 09:00:00', '2026-09-18 12:31:00', 211, 'In-app sign-up form updates, sign-up form editor and sign-up tracking events (GA4 / Meta)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_006', 'task_c2_discovery', '2026-09-21 09:00:00', '2026-09-21 11:06:00', 126, 'Framer discovery call, local app setup and P0 webhook fix (SkuFetcher / cache contract)', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_007', 'task_c2_analytics', '2026-09-22 09:00:00', '2026-09-22 10:35:00',  95, 'Analytics and webhook work', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_008', 'task_c2_planning',  '2026-09-23 09:00:00', '2026-09-23 10:25:00',  85, 'Project planning, payment orchestration research and coordination', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_009', 'task_c2_stripe',    '2026-09-24 09:00:00', '2026-09-24 09:38:00',  38, 'Stripe regulations website update, Acceptable Use Policy page and footer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  -- October totals 66h 00m. The first 40h are billed; the remaining 26h are over the quote and not charged.
  INSERT INTO "TimeEntry" ("id", "taskId", "startedAt", "endedAt", "durationMinutes", "note", "billable", "createdAt", "updatedAt") VALUES
    ('te_c2_010', 'task_c2_webhooks',   '2026-10-01 09:00:00', '2026-10-01 13:00:00', 240, 'Mailchimp sync and member lifecycle events', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_011', 'task_c2_webhooks',   '2026-10-02 09:00:00', '2026-10-02 13:00:00', 240, 'Mailchimp sync and member lifecycle events', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_012', 'task_c2_webhooks',   '2026-10-05 09:00:00', '2026-10-05 11:00:00', 120, 'Mailchimp sync and member lifecycle events', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_013', 'task_c2_webhooks',   '2026-10-06 09:00:00', '2026-10-06 10:00:00',  60, 'Old newsletter checkbox counts as marketing consent', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_014', 'task_c2_webhooks',   '2026-10-07 09:00:00', '2026-10-07 11:00:00', 120, 'Inactivity emails weekly, and old events are not replayed', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_015', 'task_c2_onboarding', '2026-10-08 09:00:00', '2026-10-08 13:00:00', 240, 'Confirm email with a code', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_016', 'task_c2_onboarding', '2026-10-09 09:00:00', '2026-10-09 13:00:00', 240, 'Confirm email with a code', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_017', 'task_c2_onboarding', '2026-10-12 09:00:00', '2026-10-12 13:00:00', 240, 'Remind, warn, then reject unfinished signups once', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_018', 'task_c2_onboarding', '2026-10-13 09:00:00', '2026-10-13 11:00:00', 120, 'Remind, warn, then reject unfinished signups once', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_019', 'task_c2_onboarding', '2026-10-14 09:00:00', '2026-10-14 11:00:00', 120, 'Signup conversion tracking', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_020', 'task_c2_onboarding', '2026-10-15 09:00:00', '2026-10-15 11:00:00', 120, 'Staff can reopen a closed account', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_021', 'task_c2_onboarding', '2026-10-16 09:00:00', '2026-10-16 13:00:00', 240, 'Staff can reopen a closed account', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_022', 'task_c2_onboarding', '2026-10-19 09:00:00', '2026-10-19 11:00:00', 120, 'Staff can reopen a closed account', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_023', 'task_c2_onboarding', '2026-10-20 09:00:00', '2026-10-20 10:00:00',  60, 'Email and pending-approval notices', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_024', 'task_c2_onboarding', '2026-10-21 09:00:00', '2026-10-21 10:00:00',  60, 'Rejection email sends once, and approved members are skipped', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_025', 'task_c2_age',        '2026-10-22 09:00:00', '2026-10-22 13:00:00', 240, 'Yoti Doc Scan when the face check fails', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_026', 'task_c2_age',        '2026-10-23 09:00:00', '2026-10-23 10:00:00',  60, 'Paid members skip the camera', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_027', 'task_c2_age',        '2026-10-26 09:00:00', '2026-10-26 10:00:00',  60, 'Camera sits in the site column', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_028', 'task_c2_dashboard',  '2026-10-27 09:00:00', '2026-10-27 13:00:00', 240, 'Overview, revenue, demographics, and bulk approve or reject', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_029', 'task_c2_dashboard',  '2026-10-28 09:00:00', '2026-10-28 13:00:00', 240, 'Overview, revenue, demographics, and bulk approve or reject', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_030', 'task_c2_dashboard',  '2026-10-29 09:00:00', '2026-10-29 13:00:00', 240, 'New member page and member lookup', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_031', 'task_c2_dashboard',  '2026-10-30 09:00:00', '2026-10-30 11:00:00', 120, 'New member page and member lookup', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_032', 'task_c2_dashboard',  '2026-11-02 09:00:00', '2026-11-02 11:00:00', 120, 'Staff can open the app as a member', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_033', 'task_c2_dashboard',  '2026-11-03 09:00:00', '2026-11-03 10:00:00',  60, 'Phone navigation', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_034', 'task_c2_appui',      '2026-11-04 09:00:00', '2026-11-04 15:00:00', 360, 'Not finished, not merged: shared skin, find people, profiles, likes and matches, subscription modal, chat, inbox and age-check camera', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_035', 'task_c2_admin',      '2026-11-05 09:00:00', '2026-11-05 13:00:00', 240, 'Meetings, billing swap, and fixing the spam bug emails', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END $$;
