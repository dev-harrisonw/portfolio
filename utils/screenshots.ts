import { Project } from "types";

export const shouldUseLiveScreenshot = (project: Project) => {
  if (!project.link) return false;
  if (project.liveScreenshot === false) return false;
  if (project.status === "deprecated" && project.liveScreenshot !== true) {
    return false;
  }
  return project.liveScreenshot === true || project.liveScreenshot === undefined;
};

export const getMicrolinkScreenshotUrl = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(
    url
  )}&screenshot=true&meta=false&embed=screenshot.url`;

export const getProjectScreenshot = (project: Project) => {
  if (shouldUseLiveScreenshot(project) && project.link) {
    return getMicrolinkScreenshotUrl(project.link);
  }
  return project.img;
};
