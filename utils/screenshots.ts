import { Project } from "types";

export const shouldUseLiveScreenshot = (project: Project) => {
  if (!project.link) return false;
  if (project.liveScreenshot === false) return false;
  if (project.status === "deprecated" && project.liveScreenshot !== true) {
    return false;
  }
  return project.liveScreenshot === true || project.liveScreenshot === undefined;
};

export const getCachedScreenshotUrl = (slug: string) =>
  `/api/project-screenshot?slug=${encodeURIComponent(slug)}&v=pan2`;

/** Fast viewport capture at a real desktop size. Used as a progressive enhancement over the static image. */
export const getMicrolinkScreenshotUrl = (url: string, force = false) => {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    "screenshot.fullPage": "true",
    meta: "false",
    embed: "screenshot.url",
    waitUntil: "load",
    "viewport.width": "1440",
    "viewport.height": "900",
  });
  if (force) params.set("force", "true");
  return `https://api.microlink.io/?${params.toString()}`;
};

export const getProjectScreenshot = (project: Project) => project.img;
