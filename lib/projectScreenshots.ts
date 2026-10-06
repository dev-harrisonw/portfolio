import fs from "fs/promises";
import os from "os";
import path from "path";

const CACHE_DIR = path.join(os.tmpdir(), "portfolio-screenshots");
const SEED_DIR = path.join(process.cwd(), "public", "static", "projects", "live");
export const SCREENSHOT_TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_MS = 25000;

/** Browser viewport — keep this at a real desktop size so 100vh heroes are not stretched. */
export const SHOT_VIEWPORT_WIDTH = 1440;
export const SHOT_VIEWPORT_HEIGHT = 900;
/** How much page to keep below the fold for the hover-pan preview. */
export const SHOT_CROP_HEIGHT = 2400;

const OVERLAY_CSS = [
  '[id*="cookie" i],[class*="cookie-banner" i],[class*="cookieconsent" i],[id*="consent" i]',
  '#onetrust-banner-sdk,#onetrust-consent-sdk,.cc-window,.osano-cm-window',
  '.qc-cmp2-container,.cky-consent-container,.cky-overlay,#CybotCookiebotDialog',
  '[aria-label*="cookie" i],.leadinModal',
  '{display:none!important;opacity:0!important;pointer-events:none!important}',
].join("");

export function screenshotCachePath(slug: string) {
  return path.join(CACHE_DIR, `${slug}.jpg`);
}

export function screenshotSeedPath(slug: string) {
  return path.join(SEED_DIR, `${slug}.jpg`);
}

function isUsableImage(buffer: Buffer) {
  return buffer.length > 20_000;
}

/** Read JPEG SOF width/height without sharp. */
function jpegDimensions(buffer: Buffer) {
  if (buffer.length < 10 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + size;
  }
  return null;
}

function isPanShot(buffer: Buffer) {
  if (!isUsableImage(buffer)) return false;
  const size = jpegDimensions(buffer);
  if (!size) return buffer.length > 40_000;
  return size.height / size.width > 0.75;
}

function panScore(buffer: Buffer) {
  const size = jpegDimensions(buffer);
  return size ? size.height / size.width : 0;
}

async function fetchImage(url: string) {
  const image = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_MS),
    headers: { Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8" },
  });
  if (!image.ok) throw new Error(`shot ${image.status}`);
  const type = image.headers.get("content-type") || "";
  if (type.includes("text/html") || type.includes("image/gif")) {
    throw new Error(`shot ${type || "html"}`);
  }
  const buffer = Buffer.from(await image.arrayBuffer());
  if (!isUsableImage(buffer)) throw new Error("shot too small");
  return buffer;
}

async function captureMicrolink(url: string) {
  const api = new URL("https://api.microlink.io");
  api.searchParams.set("url", url);
  api.searchParams.set("screenshot", "true");
  api.searchParams.set("screenshot.fullPage", "true");
  api.searchParams.set("meta", "false");
  api.searchParams.set("waitUntil", "load");
  api.searchParams.set("viewport.width", String(SHOT_VIEWPORT_WIDTH));
  api.searchParams.set("viewport.height", String(SHOT_VIEWPORT_HEIGHT));
  api.searchParams.set("styles", OVERLAY_CSS);

  const headers: Record<string, string> = {};
  if (process.env.MICROLINK_API_KEY) {
    headers["x-api-key"] = process.env.MICROLINK_API_KEY;
  }

  const meta = await fetch(api, { headers, signal: AbortSignal.timeout(FETCH_MS) });
  if (!meta.ok) throw new Error(`microlink ${meta.status}`);
  const json = (await meta.json()) as { data?: { screenshot?: { url?: string } } };
  const shot = json.data?.screenshot?.url;
  if (!shot) throw new Error("no screenshot url");
  return fetchImage(shot);
}

async function captureThum(url: string) {
  return fetchImage(
    `https://image.thum.io/get/fullpage/width/${SHOT_VIEWPORT_WIDTH}/viewportWidth/${SHOT_VIEWPORT_WIDTH}/noanimate/${encodeURI(url)}`
  );
}

async function captureMshots(url: string) {
  return fetchImage(
    `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${SHOT_VIEWPORT_WIDTH}&h=${SHOT_CROP_HEIGHT}`
  );
}

async function capture(url: string) {
  const attempts = [captureThum, captureMicrolink, captureMshots];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const buffer = await attempt(url);
      if (!isPanShot(buffer)) throw new Error("shot too short to pan");
      return buffer;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("screenshot failed");
}

export async function refreshProjectScreenshot(slug: string, url: string) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const buffer = await capture(url);
  await fs.writeFile(screenshotCachePath(slug), buffer);
  return buffer;
}

async function readFileIfPresent(file: string) {
  try {
    const stat = await fs.stat(file);
    const buffer = await fs.readFile(file);
    if (!isUsableImage(buffer)) return null;
    return { buffer, mtimeMs: stat.mtimeMs };
  } catch {
    return null;
  }
}

export async function readCachedScreenshot(slug: string) {
  const cached = await readFileIfPresent(screenshotCachePath(slug));
  const seed = await readFileIfPresent(screenshotSeedPath(slug));

  // Committed seeds win. A taller cache of a 100vh site is almost always a
  // stretched full-page stitch and should not replace a real desktop viewport.
  if (seed) {
    const seedScore = panScore(seed.buffer);
    const cacheScore = cached ? panScore(cached.buffer) : 0;
    const cacheMatches = cached && Math.abs(cacheScore - seedScore) < 0.25;
    const chosen = cacheMatches && cached.mtimeMs > seed.mtimeMs ? cached : seed;
    return {
      buffer: chosen.buffer,
      stale: Date.now() - chosen.mtimeMs > SCREENSHOT_TTL_MS,
    };
  }

  if (!cached) throw new Error("no cached screenshot");
  return {
    buffer: cached.buffer,
    stale: Date.now() - cached.mtimeMs > SCREENSHOT_TTL_MS,
  };
}
