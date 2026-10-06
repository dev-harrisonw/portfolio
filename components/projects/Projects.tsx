import React from "react";
import projects, { getSortedProjects } from "@/data/content/projects";
import { Project } from "types";
import ProjectCard from "./ProjectCard";

type ProjectProps = {
  overwriteProjects?: Project[];
};

function Projects({ overwriteProjects }: ProjectProps) {
  const projectsList = getSortedProjects(
    overwriteProjects ? overwriteProjects : projects
  );

  return (
    <div className="project-grid grid grid-cols-1 gap-8 md:grid-cols-3 items-start">
      {projectsList.map((item) => {
        return <ProjectCard key={item.id} project={item} />;
      })}
    </div>
  );
}

export default Projects;
