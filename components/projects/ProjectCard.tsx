import React from "react";
import Image from "next/image";
import { kebabCase } from "@/utils/utils";
import Link from "next/link";
import { Project } from "types";

function ProjectCard({ project }: { project: Project }) {
  const isDeprecated = project.status === "deprecated";
  const href = `/projects/${project.slug}`;

  return (
    <div className="max-w-sm mx-auto flex flex-col projects-center md:projects-start md:justify-center">
      <Link href={href}>
        <a
          className={`w-full relative rounded-xl border-fun-gray border p-2 transition hover:-translate-y-2 hover:opacity-75 hover:border-fun-pink will-change-projectCard ${
            isDeprecated ? "opacity-80" : ""
          }`}
        >
          {isDeprecated && (
            <span className="absolute top-4 left-4 z-10 text-[10px] uppercase tracking-wide rounded-lg bg-black/70 py-1 px-2 text-fun-gray border border-fun-gray">
              Handed over
            </span>
          )}
          <img className="w-full rounded-md" src={project.img} alt={project.title} />
        </a>
      </Link>
      <div className="w-full mt-5">
        <div className="flex projects-center justify-between">
          <Link href={href}>
            <a>
              <h3 className="text-lg font-bold">{project.title}</h3>
            </a>
          </Link>
          <div className="space-x-2">
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer">
                <Image
                  src="/static/icons/external-link.svg"
                  width={16}
                  height={16}
                  alt="Link Icon"
                />
              </a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noreferrer">
                <Image
                  src="/static/icons/github.svg"
                  width={16}
                  height={16}
                  alt="Github Icon"
                />
              </a>
            )}
          </div>
        </div>
        <p className="text-fun-gray text-left text-sm">{project.desc}</p>
        <ul className="flex flex-wrap items-center mt-2 -ml-2 list-none">
          {project.tags.map((tag) => {
            return (
              <li key={tag}>
                <Link href={`/projects/tag/${kebabCase(tag)}`}>
                  <div className="m-1 rounded-lg text-sm bg-fun-pink-dark py-1 px-2 cursor-pointer hover:opacity-75">
                    {tag}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default ProjectCard;
