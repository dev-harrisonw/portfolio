import type { NextApiRequest, NextApiResponse } from "next";
import { site } from "@/data/content/home";

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
  byUser: Record<string, number>;
};

function levelFromCount(count: number) {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 8) return 2;
  if (count <= 15) return 3;
  return 4;
}

function currentStreak(days: ContributionDay[]) {
  const today = new Date().toISOString().slice(0, 10);
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00Z`);
  if ((byDate.get(today) ?? 0) === 0) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((byDate.get(key) ?? 0) <= 0) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function longestStreak(days: ContributionDay[]) {
  let best = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

type Source = { username: string; host: "github" | "gitlab" };

async function fetchGithubDays(username: string) {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`
  );
  if (!response.ok) throw new Error(`${username} ${response.status}`);
  const data = await response.json();
  return (data.contributions || []) as { date: string; count: number; level: number }[];
}

/** GitLab's public contribution calendar. Days with no activity are omitted. */
async function fetchGitlabDays(username: string) {
  const response = await fetch(`https://gitlab.com/users/${encodeURIComponent(username)}/calendar.json`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${username} ${response.status}`);
  const data = (await response.json()) as Record<string, number>;
  return Object.entries(data).map(([date, count]) => ({ date, count: Number(count) || 0 }));
}

function profileUrl(source: Source) {
  const base = source.host === "gitlab" ? "https://gitlab.com" : "https://github.com";
  return `${base}/${source.username}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sources: Source[] = [
    ...site.githubUsernames.map((username) => ({ username, host: "github" as const })),
    ...(site.gitlabUsernames ?? []).map((username) => ({ username, host: "gitlab" as const })),
  ];
  const usernames = sources.map((source) => source.username);
  try {
    const results = await Promise.allSettled(
      sources.map((source) => (source.host === "gitlab" ? fetchGitlabDays(source.username) : fetchGithubDays(source.username)))
    );
    const merged = new Map<string, ContributionDay>();

    results.forEach((result, index) => {
      const source = sources[index];
      if (result.status !== "fulfilled") return;
      // GitHub supplies the full year, including empty days, so the grid stays aligned.
      // GitLab only lists active days, and those outside the year are left out.
      for (const day of result.value) {
        if (source.host === "gitlab" && !merged.has(day.date)) continue;
        const existing = merged.get(day.date) ?? { date: day.date, count: 0, level: 0, byUser: {} };
        existing.count += day.count;
        existing.byUser[source.username] = (existing.byUser[source.username] ?? 0) + day.count;
        existing.level = levelFromCount(existing.count);
        merged.set(day.date, existing);
      }
    });

    const days = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.filter((day) => day.count > 0).length;
    const loaded = sources.filter((_, i) => results[i].status === "fulfilled");

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      usernames: loaded.map((source) => source.username),
      sources: loaded.map((source) => ({ ...source, url: profileUrl(source) })),
      days,
      stats: {
        total,
        activeDays,
        currentStreak: currentStreak(days),
        longestStreak: longestStreak(days),
        byUser: Object.fromEntries(
          loaded.map((source) => [source.username, days.reduce((sum, day) => sum + (day.byUser[source.username] ?? 0), 0)])
        ),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to load contributions", usernames, days: [] });
  }
}
