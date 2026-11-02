import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Pasted connection strings often arrive as `psql 'postgresql://…'`, wrapped in quotes, or with a
 * trailing newline. Prisma rejects all of those with "the URL must start with postgresql://", which
 * took every signed-in portal/admin page down with a 500. Pull the URL out instead.
 */
function cleanDatabaseUrl(raw: string | undefined) {
  if (!raw) return undefined;
  const match = raw.match(/(?<![\w+])postgres(?:ql)?:\/\/[^\s'"]+/i);
  return match ? match[0] : undefined;
}

const datasourceUrl = cleanDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  global.prisma ||
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;
