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
  const [usernames, setUsernames] = useState<string[]>(site.githubUsernames);
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
        if (data.usernames?.length) setUsernames(data.usernames);
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
        <SectionTitle title="GitHub activity." />
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
                        {usernames
                          .filter((name) => hover.byUser[name])
                          .map((name) => `@${name} ${hover.byUser[name]}`)
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
          <p className="mt-4 text-xs text-fun-gray leading-relaxed md:whitespace-nowrap">
            Combined public activity from{" "}
            {usernames.map((name, i) => (
              <span key={name}>
                {i > 0 && (i === usernames.length - 1 ? " and " : ", ")}
                <a
                  href={`https://github.com/${name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fun-pink hover:underline"
                >
                  @{name}
                </a>
              </span>
            ))}
            {stats?.byUser && (
              <span>
                {" "}
                (
                {usernames
                  .map((name) => `${(stats.byUser[name] ?? 0).toLocaleString()} on @${name}`)
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
