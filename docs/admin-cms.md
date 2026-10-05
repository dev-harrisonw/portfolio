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
