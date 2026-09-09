import Link from "next/link";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { UserButton } from "@clerk/nextjs";

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  requireAdminPage(ctx);

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, excerpt, body, published }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }
    router.push(`/admin/posts/${data.post.id}`);
  };

  return (
    <div className="min-h-screen bg-bg text-white px-5 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/posts">
            <a className="text-sm text-fun-gray hover:text-fun-pink">← Posts</a>
          </Link>
          <h1 className="text-3xl font-bold mt-2">New post</h1>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg bg-black/20 border border-fun-gray px-3 py-2 outline-none focus:border-fun-pink"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (optional)"
          className="w-full rounded-lg bg-black/20 border border-fun-gray px-3 py-2 outline-none focus:border-fun-pink font-monospace text-sm"
        />
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Excerpt"
          rows={2}
          className="w-full rounded-lg bg-black/20 border border-fun-gray px-3 py-2 outline-none focus:border-fun-pink"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (Markdown / plain text)"
          rows={14}
          className="w-full rounded-lg bg-black/20 border border-fun-gray px-3 py-2 outline-none focus:border-fun-pink font-monospace text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-fun-gray">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Publish now
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="button"
          disabled={saving || !title}
          onClick={save}
          className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold disabled:opacity-40"
        >
          {saving ? "Saving…" : "Create post"}
        </button>
      </div>
    </div>
  );
}
