import Link from "next/link";
import { GetServerSideProps } from "next";
import { useState } from "react";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "@/lib/requireAdminPage";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Card } from "@/components/admin/Form";

type Post = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if ("redirect" in auth) return auth;
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });
  return { props: JSON.parse(JSON.stringify({ posts })) };
};

export default function AdminPosts({ posts: initial }: { posts: Post[] }) {
  const [posts, setPosts] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const previous = posts;
    setPosts((rows) => rows.filter((p) => p.id !== id));
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      setPosts(previous);
      setError("Failed to delete");
    }
  };

  return (
    <AdminShell
      title="Posts"
      actions={
        <Link href="/admin/posts/new" className="rounded-full bg-fun-pink px-4 py-2 text-sm font-bold">
          New post
        </Link>
      }
    >
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {posts.length === 0 ? (
        <Card className="text-fun-gray-light">
          No posts yet. <Link href="/admin/posts/new" className="text-fun-pink">Write the first one</Link>.
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-xl border border-fun-gray-darker p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold truncate">{post.title}</p>
                <p className="text-xs text-fun-gray">
                  /{post.slug} · {post.published ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex gap-2 text-sm shrink-0">
                <Link href={`/admin/posts/${post.id}`} className="text-fun-pink hover:underline">
                  Edit
                </Link>
                <Button variant="ghost" className="px-3 py-1 min-h-0 text-xs" onClick={() => remove(post.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
