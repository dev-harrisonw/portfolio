# Admin CMS setup

1. Copy `.env.example` to `.env` and fill Clerk keys from https://dashboard.clerk.com
2. Set `ADMIN_EMAILS` to your email (and/or set the user's `publicMetadata.role` to `"admin"` in Clerk)
3. `nvm use` (Node 20), then `yarn db:up` to start local Postgres in Docker
4. Run `yarn prisma:migrate`
5. `yarn dev` → visit `/sign-in` then `/admin`

## Production database

Create a Neon Postgres database, set `DATABASE_URL` in Vercel, and run `yarn prisma:deploy` against it (or add it to the build) to apply migrations.

## Blog

Create posts under `/admin/posts`. Published posts appear on `/blog` and `/blog/[slug]` (ISR, 60s).

## Sprints

- **Sprint 5** — Clerk, blog CMS, hire leads inbox.
- **Sprint 6** — Time tracking, retainers, invoices, Stripe checkout, client portal.
- **Sprint 7** — Finance dashboard (`/admin/finance`): collected / outstanding / overdue / aging, 12-month cash chart, utilisation, invoice CSV. Lead pipeline (`NEW → LOST`) on `/admin/leads`.
- **Sprint 8** — Operations board (`/admin/work`): task kanban, overdue builds, due payment stages, start timer. Expenses (`/admin/expenses`) feed net profit on Finance. Won leads can be converted into clients.

- **Sprint 9** — Year reports (`/admin/reports`): client profitability, spend by category, utilisation. Invoice reminders (manual + Monday cron). Activity feed on the dashboard.

Deploy the `sprint9_reports_activity` Prisma migration before using reminders or the activity feed in production (`yarn prisma:deploy`).
