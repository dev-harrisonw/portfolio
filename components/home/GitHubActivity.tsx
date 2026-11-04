import React, { useEffect, useMemo, useState } from "react";
import SectionTitle from "../global/SectionTitle";
import { site } from "@/data/content/home";
import Skeleton from "../utility/Skeleton";
import { MotionItem, MotionSection } from "../utility/Motion";

type Day = { date: string; count: number; level: number; byUser: Record<string, number> };
type Stats = {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  byUser: Record<string, number>;
};

const levelClass = ["bg-fun-gray/20", "bg-fun-pink/30", "bg-fun-pink/50", "bg-fun-pink/75", "bg-fun-pink"];

type Source = { username: string; host: "github" | "gitlab"; url: string };

function sourcesFromSite(): Source[] {
  return [
    ...site.githubUsernames.map((username) => ({ username, host: "github" as const, url: `https://github.com/${username}` })),
    ...site.gitlabUsernames.map((username) => ({ username, host: "gitlab" as const, url: `https://gitlab.com/${username}` })),
  ];
}

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function GitHubActivity() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sources, setSources] = useState<Source[]>(sourcesFromSite);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<Day | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github-contributions")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.days || data.days.length === 0) {
          setError(true);
          setDays([]);
          return;
        }
        setDays(data.days);
        setStats(data.stats ?? null);
        if (data.sources?.length) setSources(data.sources);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setDays([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const columns = useMemo(() => (days ? Math.ceil(days.length / 7) : 0), [days]);

  const selectDay = (day: Day) => {
    setHover((current) => (current?.date === day.date ? null : day));
  };

  return (
    <MotionSection className="flex flex-col relative min-w-0 w-full">
      <MotionItem>
        <SectionTitle title="Contributions." />
      </MotionItem>
      <MotionItem className="min-w-0 w-full">
        <div className="rounded-xl border border-fun-gray p-4 md:p-6 min-w-0 overflow-hidden">
          {!days && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {days && days.length > 0 && (
            <>
              <div
                className="grid w-full gap-[2px] sm:gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  gridTemplateRows: "repeat(7, minmax(0, 1fr))",
                  gridAutoFlow: "column",
                  aspectRatio: `${Math.max(columns, 1)} / 7`,
                }}
              >
                {days.map((day) => {
                  const active = hover?.date === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      aria-pressed={active}
                      aria-label={`${formatDay(day.date)}: ${day.count} contributions`}
                      onClick={() => selectDay(day)}
                      onMouseEnter={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.matchMedia("(hover: hover)").matches
                        ) {
                          setHover(day);
                        }
                      }}
                      onMouseLeave={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.matchMedia("(hover: hover)").matches
                        ) {
                          setHover((current) => (current?.date === day.date ? null : current));
                        }
                      }}
                      className={`min-w-0 w-full p-0 border-0 aspect-square rounded-[2px] transition-transform duration-150 ${
                        levelClass[Math.min(day.level, 4)]
                      } ${active ? "scale-125 ring-1 ring-white z-10" : "hover:scale-110"}`}
                    />
                  );
                })}
              </div>
              <div className="mt-4 min-h-[3.5rem] text-sm text-fun-gray-light">
                {hover ? (
                  <p>
                    <span className="text-white font-bold">{hover.count}</span> contribution
                    {hover.count === 1 ? "" : "s"} on {formatDay(hover.date)}
                    {hover.count > 0 && (
                      <span className="text-fun-gray">
                        {" "}
                        ·{" "}
                        {sources
                          .filter((source) => hover.byUser[source.username])
                          .map((source) => `@${source.username} ${hover.byUser[source.username]}`)
                          .join(" · ")}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-fun-gray">Tap a square to see that day’s commits.</p>
                )}
              </div>
            </>
          )}
          {days && (error || days.length === 0) && (
            <p className="text-sm text-fun-gray">Couldn&apos;t load the contribution graph right now.</p>
          )}
          {stats && (
            <dl className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Last year", value: stats.total.toLocaleString() },
                { label: "Active days", value: String(stats.activeDays) },
                { label: "Current streak", value: `${stats.currentStreak}d` },
                { label: "Longest streak", value: `${stats.longestStreak}d` },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-fun-gray-darker bg-black/20 px-3 py-3">
                  <dt className="text-[10px] uppercase tracking-wider text-fun-gray">{item.label}</dt>
                  <dd className="mt-1 font-monospace text-lg font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-xs text-fun-gray leading-relaxed">
            Combined public activity from{" "}
            {sources.map((source, i) => (
              <span key={`${source.host}:${source.username}`}>
                {i > 0 && (i === sources.length - 1 ? " and " : ", ")}
                <a href={source.url} target="_blank" rel="noreferrer" className="text-fun-pink hover:underline">
                  @{source.username}
                </a>
                {source.host === "gitlab" ? " on GitLab" : ""}
              </span>
            ))}
            {stats?.byUser && (
              <span>
                {" "}
                (
                {sources
                  .map((source) => `${(stats.byUser[source.username] ?? 0).toLocaleString()} on @${source.username}`)
                  .join(", ")}
                )
              </span>
            )}
            .
          </p>
        </div>
      </MotionItem>
    </MotionSection>
  );
}

export default GitHubActivity;
