import React, { useCallback, useEffect, useRef, useState } from "react";
import { Project } from "types";
import { shouldUseLiveScreenshot } from "@/utils/screenshots";

type ShotFrameProps = {
  src: string;
  alt: string;
  className?: string;
  /** Crop to 16:10 for hover-pan previews. Use auto for already-framed UI shots. */
  aspect?: "16/10" | "auto";
  onError?: () => void;
};

export function ShotFrame({
  src,
  alt,
  className = "",
  aspect = "16/10",
  onError,
}: ShotFrameProps) {
  const [ready, setReady] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const markReady = useCallback(() => {
    setReady(true);
    const measure = () => {
      const frame = frameRef.current;
      const img = imgRef.current;
      if (!frame || !img || !img.naturalWidth) return;
      const renderedHeight =
        (img.naturalHeight / img.naturalWidth) * frame.clientWidth;
      const overflow = Math.max(0, renderedHeight - frame.clientHeight);
      frame.style.setProperty("--pan", `${Math.round(overflow)}px`);
    };
    measure();
    requestAnimationFrame(measure);
  }, []);

  useEffect(() => {
    setReady(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) markReady();
  }, [src, markReady]);

  useEffect(() => {
    window.addEventListener("resize", markReady);
    return () => window.removeEventListener("resize", markReady);
  }, [markReady]);

  return (
    <div
      ref={frameRef}
      className={`project-shot relative overflow-hidden rounded-md bg-fun-gray-darkest ${
        aspect === "auto" ? "" : "aspect-[16/10]"
      } ${className}`}
    >
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-fun-pink" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`block h-auto w-full ${ready ? "opacity-100" : "opacity-0"}`}
        onLoad={markReady}
        onError={() => {
          markReady();
          onError?.();
        }}
      />
    </div>
  );
}

type ProjectImageProps = {
  project: Project;
  className?: string;
};

function ProjectImage({ project, className = "" }: ProjectImageProps) {
  const live = shouldUseLiveScreenshot(project) && Boolean(project.link);
  const seedSrc = live ? `/static/projects/live/${project.slug}.jpg?v=pan4` : project.img;
  const [src, setSrc] = useState(seedSrc);

  return (
    <ShotFrame
      src={src}
      alt={project.title}
      className={className}
      onError={() => {
        if (src !== seedSrc && src !== project.img) setSrc(seedSrc);
        else if (src !== project.img) setSrc(project.img);
      }}
    />
  );
}

export default ProjectImage;
