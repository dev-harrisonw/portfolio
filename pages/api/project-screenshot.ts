import type { NextApiRequest, NextApiResponse } from "next";
import projects from "@/data/content/projects";
import { shouldUseLiveScreenshot } from "@/utils/screenshots";
import { readCachedScreenshot, refreshProjectScreenshot } from "@/lib/projectScreenshots";

export const config = {
  api: {
    responseLimit: "8mb",
  },
  maxDuration: 30,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const slug = String(req.query.slug || "");
  const project = projects.find((item) => item.slug === slug);
  if (!project?.link || !shouldUseLiveScreenshot(project)) {
    return res.status(404).end();
  }

  try {
    const cached = await readCachedScreenshot(slug);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader(
      "Cache-Control",
      cached.stale
        ? "public, s-maxage=60, stale-while-revalidate=86400"
        : "public, s-maxage=43200, stale-while-revalidate=86400"
    );
    res.send(cached.buffer);
    if (cached.stale) {
      refreshProjectScreenshot(slug, project.link).catch(() => {});
    }
    return;
  } catch {
    try {
      const buffer = await refreshProjectScreenshot(slug, project.link);
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, s-maxage=43200, stale-while-revalidate=86400");
      return res.send(buffer);
    } catch {
      return res.status(502).end();
    }
  }
}
