-- Chapter 2 Dating, November 2026, from M14App/CHANGELOG.md.
-- 38 lines, 26.5 hours. Each line is the hours already agreed for that piece of work.
-- Idempotent: skipped when the first November entry is already there, and skipped entirely
-- if the Chapter 2 project was never created.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Project" WHERE "id" = 'proj_chapter2_platform') THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM "TimeEntry" WHERE "id" = 'te_c2_nov_01') THEN
    RETURN;
  END IF;

  INSERT INTO "Task" ("id", "projectId", "title", "status", "completedAt", "createdAt", "updatedAt") VALUES
    ('task_c2_offers', 'proj_chapter2_platform', 'Subscriptions and offers', 'DONE', '2026-11-12 00:00:00', '2026-11-03 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_phone', 'proj_chapter2_platform', 'Phone', 'DONE', '2026-11-12 00:00:00', '2026-11-06 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_chat', 'proj_chapter2_platform', 'Chat', 'DONE', '2026-11-10 00:00:00', '2026-11-08 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_support', 'proj_chapter2_platform', 'Support', 'DONE', '2026-11-12 00:00:00', '2026-11-03 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_platform', 'proj_chapter2_platform', 'Platform', 'DONE', '2026-11-12 00:00:00', '2026-11-08 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_moderation', 'proj_chapter2_platform', 'Moderation', 'DONE', '2026-11-12 00:00:00', '2026-11-10 00:00:00', CURRENT_TIMESTAMP),
    ('task_c2_tests', 'proj_chapter2_platform', 'Browser tests', 'DONE', '2026-11-07 00:00:00', '2026-11-07 00:00:00', CURRENT_TIMESTAMP);

  INSERT INTO "TimeEntry" ("id", "taskId", "startedAt", "endedAt", "durationMinutes", "note", "billable", "createdAt", "updatedAt") VALUES
    ('te_c2_nov_01', 'task_c2_offers', '2026-11-03 08:45:00', '2026-11-03 11:15:00', 150, 'Subscriptions — more than one offer can run, each aimed at the people it is for.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_02', 'task_c2_onboarding', '2026-11-03 22:42:00', '2026-11-03 23:12:00', 30, 'Onboarding — after a passed age check, the member is asked to confirm their email.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_03', 'task_c2_support', '2026-11-03 23:12:00', '2026-11-03 23:42:00', 30, 'Support — member questions on the first evening of the new offers.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_04', 'task_c2_offers', '2026-11-04 09:07:00', '2026-11-04 10:07:00', 60, 'Subscriptions — plans can be created in the dashboard, and an offer shows on the prices.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_05', 'task_c2_offers', '2026-11-05 08:39:00', '2026-11-05 09:09:00', 30, 'Subscriptions — a saved offer shows at once and keeps the plan it was given.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_06', 'task_c2_dashboard', '2026-11-06 21:18:00', '2026-11-06 22:18:00', 60, 'Dashboard — the Mailchimp test stays signed in, an offer save sticks, and the revenue page counts what it claims to.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_07', 'task_c2_phone', '2026-11-06 22:47:00', '2026-11-06 23:17:00', 30, 'Phone — the keyboard stays with iOS, and the stretched age-check camera is reverted.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_08', 'task_c2_offers', '2026-11-06 23:35:00', '2026-11-07 00:05:00', 30, 'Subscriptions — a cancelling member is asked why, and the ID upload can obtain a Yoti token.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_09', 'task_c2_age', '2026-11-07 09:49:00', '2026-11-07 11:49:00', 120, 'Age verification — an ID is checked by Yoti, the member can carry on while it runs, and the face from the check is kept.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_10', 'task_c2_tests', '2026-11-07 11:06:00', '2026-11-07 11:36:00', 30, 'Tests — browser tests find a button by its purpose, and can be run the way CI runs them.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_11', 'task_c2_appui', '2026-11-07 13:30:00', '2026-11-07 14:00:00', 30, 'Find — hide sits in the corner of a card and the card leaves the stack.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_12', 'task_c2_dashboard', '2026-11-07 14:16:00', '2026-11-07 14:46:00', 30, 'Offers — a saved Mailchimp segment is refreshed so it targets the people now in it.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_13', 'task_c2_support', '2026-11-07 14:46:00', '2026-11-07 15:16:00', 30, 'Support — member questions while the age check was going out.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_14', 'task_c2_platform', '2026-11-08 12:31:00', '2026-11-08 13:01:00', 30, 'Platform — a cron run cannot send the same events twice, including when two sites share a database.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_15', 'task_c2_dashboard', '2026-11-08 17:57:00', '2026-11-08 18:27:00', 30, 'Reporting — revenue can be compared across periods, with the cancel reason and the member''s own words.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_16', 'task_c2_onboarding', '2026-11-08 22:13:00', '2026-11-08 22:43:00', 30, 'Onboarding — a signup paused at 48 hours stays out of the approval queues.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_17', 'task_c2_chat', '2026-11-08 22:41:00', '2026-11-08 23:56:00', 75, 'Chat — a faster inbox, and the choice of how to be told.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_18', 'task_c2_chat', '2026-11-09 00:05:00', '2026-11-09 00:50:00', 45, 'Chat — live messages, reactions, replies, and unsend.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_19', 'task_c2_moderation', '2026-11-10 11:56:00', '2026-11-10 12:56:00', 60, 'Account security — other sessions end when the password or email changes, and moderators can work reports.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_20', 'task_c2_moderation', '2026-11-10 17:11:00', '2026-11-10 17:41:00', 30, 'Moderation — viewing a hibernated member leaves hibernation alone, and the member actions sit in menus.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_21', 'task_c2_offers', '2026-11-10 17:41:00', '2026-11-10 18:11:00', 30, 'Subscriptions — a gifted month adds onto time still left, and a declined charge keeps renewal on.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_22', 'task_c2_moderation', '2026-11-10 17:49:00', '2026-11-10 18:19:00', 30, 'Moderation — ban an address for one site, block an email, and see who is writing to many people on Reports.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_23', 'task_c2_dashboard', '2026-11-10 18:19:00', '2026-11-10 18:49:00', 30, 'Reporting — a free session shows who wrote in, the online chart shows the high and the low, and a report stays on the page.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_24', 'task_c2_chat', '2026-11-10 18:49:00', '2026-11-10 19:19:00', 30, 'Chat — reactions sit on the message, and an empty people list does not leave a blank strip.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_25', 'task_c2_support', '2026-11-10 19:19:00', '2026-11-10 19:49:00', 30, 'Support — member questions around the security and moderation release.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_26', 'task_c2_offers', '2026-11-10 23:05:00', '2026-11-10 23:35:00', 30, 'Subscriptions — a running price offer opens when a member signs in.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_27', 'task_c2_support', '2026-11-11 21:00:00', '2026-11-11 21:30:00', 30, 'Support — the reset link, checked with support before it was handed over.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_28', 'task_c2_support', '2026-11-11 22:03:00', '2026-11-11 22:33:00', 30, 'Support — staff can copy a one-time password reset link. Nothing is emailed.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_29', 'task_c2_offers', '2026-11-11 22:35:00', '2026-11-11 23:05:00', 30, 'Subscriptions — a member sees the offer that applies when they sign in, and a verified profile shows a check.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_30', 'task_c2_phone', '2026-11-11 23:05:00', '2026-11-12 00:20:00', 75, 'Phone — the page shell and the Capacitor app, written after the offer card and committed just after midnight.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_31', 'task_c2_phone', '2026-11-12 00:18:00', '2026-11-12 00:48:00', 30, 'Phone — the page stays put while a member moves around, signup works on a phone, and sign-in stops inventing a password.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_32', 'task_c2_phone', '2026-11-12 01:00:00', '2026-11-12 01:30:00', 30, 'Phone — an internal Chapter 2 shell that can sit next to the live app. It does not replace the store listing.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_33', 'task_c2_platform', '2026-11-12 07:39:00', '2026-11-12 08:09:00', 30, 'Platform — the site runs on the supported Node release.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_34', 'task_c2_moderation', '2026-11-12 08:09:00', '2026-11-12 08:39:00', 30, 'Moderation — staff can see the button that marks an age check as passed.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_35', 'task_c2_dashboard', '2026-11-12 08:38:00', '2026-11-12 09:08:00', 30, 'Dashboard — signup counts show how many of those people are approved.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_36', 'task_c2_phone', '2026-11-12 08:53:00', '2026-11-12 09:38:00', 45, 'Phone — the signup photo picker stays, a reset link opens during the age check, and the Cordova app sends people to ID upload.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_37', 'task_c2_age', '2026-11-12 09:56:00', '2026-11-12 10:26:00', 30, 'Phone — after the ID upload, the member comes back into the app and can carry on with the profile.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('te_c2_nov_38', 'task_c2_support', '2026-11-12 14:00:00', '2026-11-12 15:00:00', 60, 'Support — member questions, what was emailed, and this billing log.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
END $$;
