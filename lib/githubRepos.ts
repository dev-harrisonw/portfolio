import projects from "@/data/content/projects";

/**
 * Repos the public code browser may read. The API routes use GITHUB_TOKEN, so without this list anyone
 * could pass `repo=owner/private-repo` and read whatever that token can see.
 */
const allowed = new Set(projects.map((p) => p.githubRepo?.toLowerCase()).filter((r): r is string => Boolean(r)));

export function isPublicRepo(repo: unknown): repo is string {
  return typeof repo === "string" && allowed.has(repo.toLowerCase());
}

/** A file path inside a repo: no traversal, no absolute paths, no query tricks. */
export function isSafeRepoPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 500 &&
    !path.startsWith("/") &&
    !path.split("/").some((part) => part === ".." || part === "." || part === "") &&
    !/[?#\\]/.test(path)
  );
}
