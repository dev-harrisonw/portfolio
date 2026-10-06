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

async function fetchUserDays(username: string) {
  const response = await fetch(
    `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`
  );
  if (!response.ok) throw new Error(`${username} ${response.status}`);
  const data = await response.json();
  return (data.contributions || []) as { date: string; count: number; level: number }[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const usernames = site.githubUsernames;
  try {
    const results = await Promise.allSettled(usernames.map((name) => fetchUserDays(name)));
    const merged = new Map<string, ContributionDay>();

    results.forEach((result, index) => {
      const username = usernames[index];
      if (result.status !== "fulfilled") return;
      for (const day of result.value) {
        const existing = merged.get(day.date) ?? { date: day.date, count: 0, level: 0, byUser: {} };
        existing.count += day.count;
        existing.byUser[username] = day.count;
        existing.level = levelFromCount(existing.count);
        merged.set(day.date, existing);
      }
    });

    const days = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.filter((day) => day.count > 0).length;
    const loaded = usernames.filter((_, i) => results[i].status === "fulfilled");

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({
      usernames: loaded,
      days,
      stats: {
        total,
        activeDays,
        currentStreak: currentStreak(days),
        longestStreak: longestStreak(days),
        byUser: Object.fromEntries(
          loaded.map((name) => [name, days.reduce((sum, day) => sum + (day.byUser[name] ?? 0), 0)])
        ),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to load GitHub contributions", usernames, days: [] });
  }
}
