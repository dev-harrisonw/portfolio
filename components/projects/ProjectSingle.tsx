import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Project, ProjectShot } from "types";
import { kebabCase } from "@/utils/utils";
import ProjectImage, { ShotFrame } from "./ProjectImage";
import RepoCodeBrowser from "./RepoCodeBrowser";

function ShotGrid({
  title,
  shots,
}: {
  title: string;
  shots: ProjectShot[];
}) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {shots.map((shot) => (
          <figure
            key={shot.src}
            className="rounded-xl border border-fun-gray p-2 bg-bg"
          >
            <ShotFrame src={shot.src} alt={shot.label} />
            <figcaption className="px-1 pt-3 pb-1">
              <p className="text-sm font-semibold">{shot.label}</p>
              {shot.caption && (
                <p className="text-xs text-fun-gray mt-1">{shot.caption}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function ProjectSingle({ project }: { project: Project }) {
  const isDeprecated = project.status === "deprecated";
  const dashboards = project.dashboards || [];
  const gallery = project.gallery || [];
  const highlights = project.highlights || [];
  const surfaces = project.surfaces || [];

  return (
    <div className="w-full max-w-5xl mx-auto pt-10 pb-16 text-left">
      <article>
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-fun-gray hover:text-fun-pink transition-colors mb-8"
        >
          ← Back to projects
        </Link>

        <div className="relative rounded-xl border border-fun-gray p-2 mb-8">
          <ProjectImage project={project} />
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{project.title}</h1>
              {isDeprecated && (
                <span className="text-xs uppercase tracking-wide rounded-lg border border-fun-gray bg-fun-gray-dark py-1 px-2 text-fun-gray">
                  Deprecated
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

        {highlights.length > 0 && (
          <ul className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-3 list-none">
            {highlights.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-fun-gray px-4 py-3 text-sm text-white/90"
              >
                {item}
              </li>
            ))}
          </ul>
        )}

        {surfaces.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">What shipped</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {surfaces.map((surface) => (
                <div
                  key={surface.name}
                  className="rounded-lg border border-fun-gray px-4 py-4"
                >
                  <h3 className="font-semibold text-fun-pink text-sm uppercase tracking-wide">
                    {surface.name}
                  </h3>
                  <p className="mt-2 text-sm text-fun-gray">{surface.detail}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {dashboards.length > 0 && (
          <ShotGrid title="Dashboards" shots={dashboards} />
        )}

        {gallery.length > 0 && (
          <ShotGrid title="Public product" shots={gallery} />
        )}

        <ul className="flex flex-wrap items-center -ml-2 list-none mb-12">
          {project.tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/projects/tag/${kebabCase(tag)}`}
                className="m-1 inline-block rounded-lg text-sm bg-fun-pink-dark py-1 px-2 cursor-pointer hover:opacity-75"
              >
                {tag}
              </Link>
            </li>
          ))}
        </ul>
      </article>

      {project.githubRepo && (
        <RepoCodeBrowser repo={project.githubRepo} githubUrl={project.github} />
      )}
    </div>
  );
}

export default ProjectSingle;
