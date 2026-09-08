import React, { useState } from "react";
import { Project } from "types";
import { getProjectScreenshot } from "@/utils/screenshots";

type ProjectImageProps = {
  project: Project;
  className?: string;
};

function ProjectImage({ project, className = "w-full rounded-md" }: ProjectImageProps) {
  const [src, setSrc] = useState(getProjectScreenshot(project));

  return (
    <img
      className={className}
      src={src}
      alt={project.title}
      onError={() => {
        if (src !== project.img) {
          setSrc(project.img);
        }
      }}
    />
  );
}

export default ProjectImage;
