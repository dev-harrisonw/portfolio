export type ProjectStatus = "active" | "deprecated";

export type ProjectShot = {
  src: string;
  label: string;
  caption?: string;
};

export type ProjectSurface = {
  name: string;
  detail: string;
};

export type Project = {
  id: number;
  title: string;
  slug: string;
  desc: string;
  overview: string;
  img: string;
  link?: string;
  github?: string;
  githubRepo?: string;
  tags: string[];
  status: ProjectStatus;
  statusNote?: string;
  featured?: boolean;
  year?: number;
  liveScreenshot?: boolean;
  noindex?: boolean;
  highlights?: string[];
  dashboards?: ProjectShot[];
  gallery?: ProjectShot[];
  surfaces?: ProjectSurface[];
};
