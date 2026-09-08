/**
 * Blog + Clerk admin foundations (Sprint 5).
 * Content will move to Prisma once Clerk auth and Postgres are wired.
 * Until then this documents the post shape and holds a placeholder list.
 */

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: string;
  updatedAt?: string;
  authorId?: string;
};

/** Placeholder until the admin CMS ships. */
export const blogPosts: BlogPost[] = [];
