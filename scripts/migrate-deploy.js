/* Applies pending Prisma migrations during a production Vercel build.
 *
 * - Only runs for VERCEL_ENV=production, so previews and local builds never touch the database.
 * - Cleans DATABASE_URL the same way lib/prisma.ts does (psql wrapper, quotes, whitespace), because
 *   `prisma migrate deploy` reads the raw env var and rejects anything that isn't a plain URL.
 * - `migrate deploy` only applies migrations that are not yet recorded; it never drops or resets data.
 * - A failure fails the build, so a broken migration keeps the last working deployment live.
 */
const { spawnSync } = require("node:child_process");

if (process.env.VERCEL_ENV !== "production") {
  console.log("migrate-deploy: skipped (not a production build)");
  process.exit(0);
}

const URL_PATTERN = /(?<![\w+])postgres(?:ql)?:\/\/[^\s'"]+/i;
const clean = (value) => (value || "").match(URL_PATTERN)?.[0];

// Migrations need a direct connection: pooled (pgbouncer) connections cannot hold the advisory lock
// `migrate deploy` takes, and fail with P1002 after 10s. Prefer an explicit unpooled URL, otherwise
// derive one by dropping Neon's "-pooler" host suffix.
const explicit = clean(process.env.DATABASE_URL_UNPOOLED) || clean(process.env.DIRECT_URL);
const pooled = clean(process.env.DATABASE_URL);
const direct = explicit || (pooled && pooled.replace(/-pooler(?=\.)/, ""));

if (!direct) {
  console.error("migrate-deploy: DATABASE_URL is missing or is not a postgresql:// URL");
  process.exit(1);
}
console.log(`migrate-deploy: using ${explicit ? "explicit unpooled" : direct !== pooled ? "derived direct" : "configured"} connection`);

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});

process.exit(result.status === null ? 1 : result.status);
