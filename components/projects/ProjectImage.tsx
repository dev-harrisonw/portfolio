import React, { useCallback, useEffect, useRef, useState } from "react";
import { Project } from "types";
import {
  getMicrolinkScreenshotUrl,
  getProjectScreenshot,
  shouldUseLiveScreenshot,
} from "@/utils/screenshots";

type ProjectImageProps = {
  project: Project;
  className?: string;
};

function ProjectImage({ project, className = "" }: ProjectImageProps) {
  const live = shouldUseLiveScreenshot(project) && Boolean(project.link);
  const [src, setSrc] = useState(() => getProjectScreenshot(project));
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const attempts = useRef(0);

  const measure = useCallback(() => {
    const frame = frameRef.current;
    const img = imgRef.current;
    if (!frame || !img) return;
    const pan = Math.max(0, img.offsetHeight - frame.clientHeight);
    frame.style.setProperty("--pan", `${pan}px`);
  }, []);

  const reloadLive = useCallback(() => {
    if (!live || !project.link || attempts.current >= 3) return;
    attempts.current += 1;
    setReady(false);
    const next = getMicrolinkScreenshotUrl(project.link, attempts.current > 1);
    setSrc("");
    requestAnimationFrame(() => setSrc(next));
  }, [live, project.link]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!src) return;
    const img = imgRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setReady(true);
      measure();
      return;
    }
    if (img.complete && img.naturalWidth === 0) reloadLive();
  }, [src, measure, reloadLive]);

  useEffect(() => {
    if (ready) measure();
  }, [ready, measure]);

  return (
    <div
      ref={frameRef}
      className={`project-shot relative aspect-[16/10] overflow-hidden rounded-md bg-fun-gray-darkest ${className}`}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-fun-pink" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={project.title}
        className={`block h-auto w-full ${ready ? "opacity-100" : "opacity-0"}`}
        onLoad={() => {
          if (imgRef.current && imgRef.current.naturalWidth === 0) {
            reloadLive();
            return;
          }
          setReady(true);
          requestAnimationFrame(measure);
        }}
        onError={() => {
          if (!src) return;
          if (live) {
            reloadLive();
            return;
          }
          if (src !== project.img) setSrc(project.img);
        }}
      />
    </div>
  );
}

export default ProjectImage;
