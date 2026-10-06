import React, { useEffect, useMemo, useState } from "react";
import SectionTitle from "../global/SectionTitle";
import experience, {
  ExperienceItem,
  ExperienceRole,
} from "@/data/content/experience";
import { formatDateRange } from "@/utils/utils";
import { MotionItem, MotionSection } from "../utility/Motion";

function googleFavicon(website?: string) {
  if (!website) return null;
  try {
    const host = new URL(website).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      host
    )}&sz=128`;
  } catch {
    return null;
  }
}

function companyInitials(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleSpan(roles: ExperienceRole[]) {
  const start = roles.reduce(
    (min, role) => (role.startDate < min ? role.startDate : min),
    roles[0].startDate
  );
  const ongoing = roles.some((role) => !role.endDate);
  const end = ongoing
    ? null
    : roles.reduce((max, role) => {
        if (!role.endDate) return max;
        if (!max || role.endDate > max) return role.endDate;
        return max;
      }, null as string | null);
  return { start, end };
}

function useDateRange(start: string, end?: string | null) {
  const [range, setRange] = useState(() => formatDateRange(start, end));

  useEffect(() => {
    setRange(formatDateRange(start, end));
  }, [start, end]);

  return range;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] sm:text-xs text-fun-gray">
      {children}
    </span>
  );
}

function CompanyLogo({ item }: { item: ExperienceItem }) {
  const fallback = googleFavicon(item.website);
  const [src, setSrc] = useState(item.logo || fallback || "");
  const [mode, setMode] = useState<"asset" | "google" | "initials">(
    item.logo ? "asset" : fallback ? "google" : "initials"
  );

  const onError = () => {
    if (mode === "asset" && fallback) {
      setSrc(fallback);
      setMode("google");
      return;
    }
    setSrc("");
    setMode("initials");
  };

  return (
    <div
      className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 ${
        item.logoBg || "bg-black"
      }`}
    >
      {mode !== "initials" && src ? (
        <img
          src={src}
          alt=""
          onError={onError}
          className={`h-full w-full ${
            item.logoFit === "contain" ? "object-contain p-1.5" : "object-cover"
          }`}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-fun-pink">
          {companyInitials(item.company)}
        </span>
      )}
    </div>
  );
}

function RoleBlock({
  role,
  company,
  nested,
}: {
  role: ExperienceRole;
  company: ExperienceItem;
  nested?: boolean;
}) {
  const range = useDateRange(role.startDate, role.endDate);
  const location =
    nested && role.location && role.location !== company.location
      ? role.location
      : nested
      ? null
      : role.location || company.location;
  const workMode =
    nested && role.workMode && role.workMode !== company.workMode
      ? role.workMode
      : nested
      ? null
      : role.workMode || company.workMode;
  const employmentType =
    nested &&
    role.employmentType &&
    role.employmentType !== company.employmentType
      ? role.employmentType
      : null;
  const meta = [location, workMode, employmentType].filter(Boolean).join(" · ");

  return (
    <div className="min-w-0">
      <h4 className="text-base font-semibold text-white">{role.title}</h4>
      <p className="mt-0.5 text-sm text-fun-gray">{range}</p>
      {meta && <p className="mt-0.5 text-sm text-fun-gray">{meta}</p>}
      {role.skills && role.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {role.skills.map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceCard({ item }: { item: ExperienceItem }) {
  const span = useMemo(() => roleSpan(item.roles), [item.roles]);
  const companyRange = useDateRange(span.start, span.end);
  const multi = item.roles.length > 1;
  const meta = [item.location, item.workMode, item.employmentType]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <CompanyLogo item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-tight sm:text-xl">
                {item.website ? (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 hover:text-fun-pink"
                  >
                    <span className="truncate">{item.company}</span>
                    <svg
                      className="h-3.5 w-3.5 shrink-0 opacity-60"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8A1.5 1.5 0 0 0 13 12.5V10M9 2h5v5M7 9l7-7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ) : (
                  item.company
                )}
              </h3>
              {!multi && (
                <p className="mt-0.5 text-base font-semibold text-white sm:text-lg">
                  {item.roles[0].title}
                </p>
              )}
            </div>
            <p className="text-sm text-fun-gray sm:max-w-[14rem] sm:text-right sm:leading-snug">
              {companyRange}
            </p>
          </div>
          {meta && (
            <p className="mt-1 text-sm text-fun-gray">{meta}</p>
          )}
          {!multi && item.roles[0].skills && item.roles[0].skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.roles[0].skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      {multi && (
        <ol className="relative mt-4 space-y-5 sm:ml-20">
          {item.roles.map((role, index) => (
            <li
              key={`${item.company}-${role.title}-${role.startDate}`}
              className="relative pl-5"
            >
              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-fun-pink" />
              {index < item.roles.length - 1 && (
                <span className="absolute left-[3px] top-4 bottom-[-22px] w-px bg-fun-pink/40" />
              )}
              <RoleBlock role={role} company={item} nested />
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function Experience() {
  return (
    <MotionSection className="relative flex flex-col text-left justify-between">
      <MotionItem>
        <SectionTitle title="Where I've been working." />
      </MotionItem>
      <div className="experience-grid grid grid-cols-1 gap-4 md:gap-5">
        {experience.map((item) => (
          <MotionItem key={item.company}>
            <ExperienceCard item={item} />
          </MotionItem>
        ))}
      </div>
    </MotionSection>
  );
}

export default Experience;
