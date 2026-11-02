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

const raw = process.env.DATABASE_URL || "";
const match = raw.match(/(?<![\w+])postgres(?:ql)?:\/\/[^\s'"]+/i);
if (!match) {
  console.error("migrate-deploy: DATABASE_URL is missing or is not a postgresql:// URL");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: match[0] },
});

process.exit(result.status === null ? 1 : result.status);
