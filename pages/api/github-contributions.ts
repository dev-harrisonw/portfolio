import type { NextApiRequest, NextApiResponse } from "next";
import { site } from "@/data/content/home";

type Day = { date: string; count: number; level: number };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const username = (req.query.username as string) || site.githubUsername;

  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(
        username
      )}?y=last`
    );

    if (!response.ok) {
      throw new Error(`Upstream ${response.status}`);
    }

    const data = await response.json();
    const days: Day[] = (data.contributions || []).map((day: any) => ({
      date: day.date,
      count: day.count,
      level: day.level,
    }));

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json({ username, days });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load GitHub contributions",
      username,
      days: [],
    });
  }
}
