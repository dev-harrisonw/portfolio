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

  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  if (req.method === "GET") {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ post });
  }

  if (req.method === "PUT") {
    const { title, excerpt, body, coverImage, published, slug } = req.body || {};
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const nextPublished =
      typeof published === "boolean" ? published : existing.published;

    try {
      const post = await prisma.post.update({
        where: { id },
        data: {
          title: title ?? existing.title,
          slug:
            (typeof slug === "string" && slug.trim()) ||
            (title ? slugify(title) : existing.slug),
          excerpt: excerpt ?? existing.excerpt,
          body: body ?? existing.body,
          coverImage:
            coverImage === undefined ? existing.coverImage : coverImage,
          published: nextPublished,
          publishedAt: nextPublished
            ? existing.publishedAt || new Date()
            : null,
        },
      });
      return res.status(200).json({ post });
    } catch (error: any) {
      if (error?.code === "P2002") {
        return res.status(409).json({ error: "Slug already exists" });
      }
      return res.status(500).json({ error: "Failed to update post" });
    }
  }

  if (req.method === "DELETE") {
    await prisma.post.delete({ where: { id } });
    return res.status(204).end();
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
