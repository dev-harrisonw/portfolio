/** Same-origin path only. Blocks protocol-relative and off-site redirects. */
export function safeInternalPath(value: unknown, fallback = "/portal") {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2000) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) return fallback;

  const path = raw.split(/[?#]/)[0];
  if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) return fallback;
  return raw;
}
