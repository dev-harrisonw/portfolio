import Page from "components/utility/Page";
import { GetStaticPaths, GetStaticProps } from "next";
import projects, { getProjectBySlug } from "@/data/content/projects";
import ProjectSingle from "components/projects/ProjectSingle";
import { Project } from "types";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: projects.map((project) => ({
      params: { slug: project.slug },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { notFound: true };
  }

  return {
    props: JSON.parse(JSON.stringify({ project })),
  };
};

function ProjectPage({ project }: { project: Project }) {
  return (
    <Page
      currentPage="Projects"
      meta={{
        title: project.title,
        desc: project.desc,
      }}
    >
      <ProjectSingle project={project} />
    </Page>
  );
}

export default ProjectPage;
