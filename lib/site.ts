const PRODUCTION_ORIGIN = "https://harrisonwarburton.com";

function clean(value: string | undefined) {
  const trimmed = value?.trim().replace(/\/$/, "");
  return trimmed || "";
}

/** Public origin for links in emails. A deployed site never falls back to localhost. */
export function siteUrl() {
  const configured = clean(process.env.NEXT_PUBLIC_SITE_URL);
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;
  if (process.env.VERCEL) return PRODUCTION_ORIGIN;
  return "http://localhost:3000";
}
