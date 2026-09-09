# Admin CMS setup

1. Copy `.env.example` to `.env` and fill Clerk keys from https://dashboard.clerk.com
2. Set `ADMIN_EMAILS` to your email (and/or set the user's `publicMetadata.role` to `"admin"` in Clerk)
3. Run `yarn prisma:migrate` (already done locally with SQLite)
4. `yarn dev` → visit `/sign-in` then `/admin`

## Production database

SQLite is fine locally. On Vercel, change `prisma/schema.prisma` datasource to `postgresql` and set `DATABASE_URL` to Neon/Supabase, then run migrations against that database.

## Blog

Create posts under `/admin/posts`. Published posts appear on `/blog` and `/blog/[slug]` (ISR, 60s).
