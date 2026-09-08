import type { NextApiRequest, NextApiResponse } from "next";

const GITHUB_API = "https://api.github.com";

function authHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "harrisonwarburton-portfolio",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const repo = req.query.repo as string;
  if (!repo || !repo.includes("/")) {
    return res.status(400).json({ error: "repo must be owner/name" });
  }

  try {
    const repoRes = await fetch(`${GITHUB_API}/repos/${repo}`, {
      headers: authHeaders(),
    });
    if (!repoRes.ok) {
      return res.status(repoRes.status).json({ error: "Repo not found" });
    }
    const repoJson = await repoRes.json();
    const branch = repoJson.default_branch || "main";

    const treeRes = await fetch(
      `${GITHUB_API}/repos/${repo}/git/trees/${branch}?recursive=1`,
      { headers: authHeaders() }
    );
    if (!treeRes.ok) {
      return res.status(treeRes.status).json({ error: "Failed to load tree" });
    }
    const treeJson = await treeRes.json();

    const ignore = [
      "node_modules/",
      "vendor/",
      ".git/",
      "dist/",
      "build/",
      ".next/",
    ];

    const files = (treeJson.tree || [])
      .filter((item: any) => item.type === "blob")
      .filter(
        (item: any) => !ignore.some((prefix) => item.path.startsWith(prefix))
      )
      .filter((item: any) => (item.size || 0) < 250_000)
      .map((item: any) => ({
        path: item.path,
        size: item.size,
        sha: item.sha,
      }))
      .slice(0, 400);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=86400"
    );
    res.status(200).json({ repo, branch, files });
  } catch (error) {
    res.status(500).json({ error: "Failed to load repository tree" });
  }
}
