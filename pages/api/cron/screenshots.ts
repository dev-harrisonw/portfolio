import type { NextApiRequest, NextApiResponse } from "next";
import projects from "@/data/content/projects";
import { shouldUseLiveScreenshot } from "@/utils/screenshots";
import { refreshProjectScreenshot } from "@/lib/projectScreenshots";

/** Daily warm of cached live project screenshots. Protected by CRON_SECRET. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const targets = projects.filter(
    (project) => project.link && shouldUseLiveScreenshot(project)
  );
  const refreshed: string[] = [];
  const failed: string[] = [];

  for (const project of targets) {
    try {
      await refreshProjectScreenshot(project.slug, project.link as string);
      refreshed.push(project.slug);
    } catch {
      failed.push(project.slug);
    }
  }

  res.status(200).json({ refreshed, failed });
}
