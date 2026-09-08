import React, { useEffect, useState } from "react";
import SectionTitle from "../global/SectionTitle";
import { site } from "@/data/content/home";
import Skeleton from "../utility/Skeleton";
import { MotionItem, MotionSection } from "../utility/Motion";

type Day = { date: string; count: number; level: number };

const levelClass = [
  "bg-fun-gray/20",
  "bg-fun-pink/30",
  "bg-fun-pink/50",
  "bg-fun-pink/75",
  "bg-fun-pink",
];

function GitHubActivity() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/github-contributions?username=${site.githubUsername}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.days || data.days.length === 0) {
          setError(true);
          setDays([]);
          return;
        }
        setDays(data.days);
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

  return (
    <MotionSection className="flex flex-col relative">
      <MotionItem>
        <SectionTitle title="Personal GitHub activity." />
      </MotionItem>
      <MotionItem>
        <div className="rounded-xl border border-fun-gray p-4 md:p-6 overflow-x-auto">
          {!days && (
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-24 w-full min-w-[640px]" />
            </div>
          )}
          {days && days.length > 0 && (
            <div
              className="grid gap-[3px] min-w-[640px]"
              style={{
                gridTemplateColumns: `repeat(${Math.ceil(days.length / 7)}, minmax(0, 1fr))`,
                gridAutoFlow: "column",
                gridTemplateRows: "repeat(7, minmax(0, 1fr))",
              }}
            >
              {days.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} contribution${
                    day.count === 1 ? "" : "s"
                  }`}
                  className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-[2px] ${
                    levelClass[Math.min(day.level, 4)]
                  }`}
                />
              ))}
            </div>
          )}
          {days && (error || days.length === 0) && (
            <p className="text-sm text-fun-gray">
              Couldn&apos;t load the contribution graph right now.{" "}
              <a
                href={`https://github.com/${site.githubUsername}`}
                target="_blank"
                rel="noreferrer"
                className="text-fun-pink hover:underline"
              >
                View on GitHub
              </a>
              .
            </p>
          )}
          <p className="mt-4 text-xs text-fun-gray leading-relaxed max-w-2xl">
            Note: professional / client work often lives on separate GitHub
            accounts, so this heatmap only reflects personal and public activity
            on{" "}
            <a
              href={`https://github.com/${site.githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-fun-pink hover:underline"
            >
              @{site.githubUsername}
            </a>
            —not my full professional output.
          </p>
        </div>
      </MotionItem>
    </MotionSection>
  );
}

export default GitHubActivity;
