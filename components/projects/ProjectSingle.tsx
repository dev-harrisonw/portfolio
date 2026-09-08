import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Project } from "types";
import { kebabCase } from "@/utils/utils";
import ProjectImage from "./ProjectImage";
import RepoCodeBrowser from "./RepoCodeBrowser";

function ProjectSingle({ project }: { project: Project }) {
  const isDeprecated = project.status === "deprecated";

  return (
    <article className="w-full max-w-3xl mx-auto px-5 md:px-0 py-10">
      <Link href="/projects">
        <a className="inline-flex items-center text-sm text-fun-gray hover:text-fun-pink transition-colors mb-8">
          ← Back to projects
        </a>
      </Link>

      <div className="relative rounded-xl border border-fun-gray p-2 mb-8">
        <ProjectImage project={project} />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>
            {isDeprecated && (
              <span className="text-xs uppercase tracking-wide rounded-lg bg-fun-gray-dark py-1 px-2 text-fun-gray">
                Handed over
              </span>
            )}
            {project.year && (
              <span className="text-sm text-fun-gray">{project.year}</span>
            )}
          </div>
          <p className="text-fun-gray text-sm">{project.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-fun-pink text-fun-pink hover:bg-fun-pink hover:text-white transition-colors rounded-full px-4 py-2 text-sm"
            >
              {isDeprecated ? "Current site" : "Live site"}
              <Image
                src="/static/icons/external-link.svg"
                width={14}
                height={14}
                alt=""
              />
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-fun-gray text-fun-gray hover:border-fun-pink hover:text-fun-pink transition-colors rounded-full px-4 py-2 text-sm"
            >
              GitHub
              <Image
                src="/static/icons/github.svg"
                width={14}
                height={14}
                alt=""
              />
            </a>
          )}
        </div>
      </div>

      {isDeprecated && (
        <div className="mb-6 rounded-lg border border-fun-gray bg-bg px-4 py-3 text-sm text-fun-gray">
          {project.statusNote ||
            "Built by me; another agency has since taken over maintenance. The live site may no longer reflect this original work."}
        </div>
      )}

      <div className="prose-like space-y-4 text-base leading-relaxed text-white/90 mb-8">
        {project.overview.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <ul className="flex flex-wrap items-center -ml-2 list-none">
        {project.tags.map((tag) => (
          <li key={tag}>
            <Link href={`/projects/tag/${kebabCase(tag)}`}>
              <a className="m-1 inline-block rounded-lg text-sm bg-fun-pink-dark py-1 px-2 cursor-pointer hover:opacity-75">
                {tag}
              </a>
            </Link>
          </li>
        ))}
      </ul>

      {project.githubRepo && (
        <RepoCodeBrowser repo={project.githubRepo} githubUrl={project.github} />
      )}
    </article>
  );
}

export default ProjectSingle;
