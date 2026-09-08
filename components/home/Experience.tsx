import React, { useEffect, useState } from "react";
import SectionTitle from "../global/SectionTitle";
import experience, {
  ExperienceItem,
  ExperienceRole,
} from "@/data/content/experience";
import { formatDateRange } from "@/utils/utils";
import { MotionItem, MotionSection } from "../utility/Motion";

function RoleMeta({
  role,
  company,
}: {
  role: ExperienceRole;
  company: ExperienceItem;
}) {
  const [range, setRange] = useState(() =>
    formatDateRange(role.startDate, role.endDate)
  );

  useEffect(() => {
    setRange(formatDateRange(role.startDate, role.endDate));
  }, [role.startDate, role.endDate]);

  const employmentType = role.employmentType || company.employmentType;
  const location = role.location || company.location;
  const workMode = role.workMode || company.workMode;

  return (
    <p className="text-sm text-fun-gray mt-1">
      {employmentType && <span>{employmentType}</span>}
      {employmentType && (location || workMode) && <span> · </span>}
      <span>{range}</span>
      {(location || workMode) && (
        <>
          <br />
          <span>{[location, workMode].filter(Boolean).join(" · ")}</span>
        </>
      )}
    </p>
  );
}

function Experience() {
  return (
    <MotionSection className="flex flex-col text-left justify-between relative">
      <MotionItem>
        <SectionTitle title="Where I've been working." />
      </MotionItem>
      <ol className="relative border-l border-fun-gray ml-3 md:ml-4 space-y-10">
        {experience.map((item) => {
          const initials = item.company
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <MotionItem key={item.company}>
              <li className="relative ml-6 md:ml-8">
                <span className="absolute -left-3 md:-left-3.5 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border border-fun-pink bg-bg text-[10px] font-bold text-fun-pink">
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{item.company}</h3>
                    {item.roles.length > 1 && item.employmentType && (
                      <p className="text-sm text-fun-gray mt-1">
                        {item.employmentType}
                        {item.workMode ? ` · ${item.workMode}` : ""}
                      </p>
                    )}
                  </div>
                  {item.roles.map((role) => (
                    <div
                      key={`${item.company}-${role.title}-${role.startDate}`}
                    >
                      <h4 className="text-lg font-semibold text-white">
                        {role.title}
                      </h4>
                      <RoleMeta role={role} company={item} />
                      {role.skills && role.skills.length > 0 && (
                        <p className="text-xs text-fun-gray mt-2">
                          {role.skills.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            </MotionItem>
          );
        })}
      </ol>
    </MotionSection>
  );
}

export default Experience;
