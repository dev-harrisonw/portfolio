import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAdmin, slugify } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    const posts = await prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return res.status(200).json({ posts });
  }

  if (req.method === "POST") {
    const { title, excerpt, body, coverImage, published, slug } = req.body || {};
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }

    const finalSlug =
      (typeof slug === "string" && slug.trim()) || slugify(title);

    try {
      const post = await prisma.post.create({
        data: {
          title,
          slug: finalSlug,
          excerpt: excerpt || "",
          body: body || "",
          coverImage: coverImage || null,
          published: Boolean(published),
          publishedAt: published ? new Date() : null,
          authorId: auth.userId,
        },
      });
      return res.status(201).json({ post });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(409).json({ error: "Slug already exists" });
      }
      return res.status(500).json({ error: "Failed to create post" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
