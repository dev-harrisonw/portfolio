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
  const path = req.query.path as string;

  if (!repo || !path) {
    return res.status(400).json({ error: "repo and path are required" });
  }

  try {
    const fileRes = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${encodeURI(
        path
      ).replace(/%2F/g, "/")}`,
      { headers: authHeaders() }
    );

    if (!fileRes.ok) {
      return res.status(fileRes.status).json({ error: "File not found" });
    }

    const json = await fileRes.json();
    if (json.type !== "file") {
      return res.status(400).json({ error: "Path is not a file" });
    }

    if (json.size > 250_000) {
      return res.status(413).json({
        error: "File too large to preview",
        html_url: json.html_url,
      });
    }

    const content = Buffer.from(json.content || "", "base64").toString("utf8");

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=1800, stale-while-revalidate=86400"
    );
    res.status(200).json({
      path: json.path,
      size: json.size,
      content,
      html_url: json.html_url,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load file" });
  }
}
