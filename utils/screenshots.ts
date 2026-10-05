import { Project } from "types";

export const shouldUseLiveScreenshot = (project: Project) => {
  if (!project.link) return false;
  if (project.liveScreenshot === false) return false;
  if (project.status === "deprecated" && project.liveScreenshot !== true) {
    return false;
  }
  return project.liveScreenshot === true || project.liveScreenshot === undefined;
};

export const getMicrolinkScreenshotUrl = (url: string, force = false) => {
  const params = new URLSearchParams({
    url,
    screenshot: "true",
    meta: "false",
    embed: "screenshot.url",
    "screenshot.fullPage": "true",
    waitUntil: "networkidle2",
    waitForTimeout: "4000",
  });
  if (force) params.set("force", "true");
  return `https://api.microlink.io/?${params.toString()}`;
};

export const getProjectScreenshot = (project: Project) => {
  if (shouldUseLiveScreenshot(project) && project.link) {
    return getMicrolinkScreenshotUrl(project.link);
  }
  return project.img;
};
