import Link from "next/link";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { UserButton } from "@clerk/nextjs";

type Post = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
};

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  requireAdminPage(ctx);

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPosts(data.posts || []);
      })
      .catch(() => setError("Failed to load posts"));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="min-h-screen bg-bg text-white px-5 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin">
            <a className="text-sm text-fun-gray hover:text-fun-pink">← Admin</a>
          </Link>
          <h1 className="text-3xl font-bold mt-2">Posts</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/posts/new">
            <a className="rounded-full bg-fun-pink px-4 py-2 text-sm font-bold">
              New post
            </a>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <ul className="space-y-3">
        {posts.map((post) => (
          <li
            key={post.id}
            className="rounded-xl border border-fun-gray p-4 flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-bold">{post.title}</p>
              <p className="text-xs text-fun-gray">
                /{post.slug} · {post.published ? "Published" : "Draft"}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <Link href={`/admin/posts/${post.id}`}>
                <a className="text-fun-pink hover:underline">Edit</a>
              </Link>
              <button
                type="button"
                onClick={() => remove(post.id)}
                className="text-fun-gray hover:text-white"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
        {posts.length === 0 && !error && (
          <li className="text-fun-gray text-sm">No posts yet.</li>
        )}
      </ul>
    </div>
  );
}
