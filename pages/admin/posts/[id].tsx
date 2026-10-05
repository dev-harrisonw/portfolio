import Link from "next/link";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { UserButton } from "@clerk/nextjs";

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  requireAdminPage(ctx);

export default function EditPostPage() {
  const router = useRouter();
  const id = router.query.id as string;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.post) {
          setTitle(data.post.title);
          setSlug(data.post.slug);
          setExcerpt(data.post.excerpt || "");
          setBody(data.post.body || "");
          setPublished(Boolean(data.post.published));
          setLoaded(true);
        } else {
          setError(data.error || "Not found");
        }
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, excerpt, body, published }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }
  };

  if (!loaded && !error) {
    return (
      <div className="min-h-screen bg-bg text-fun-gray px-5 py-10">Loading…</div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-white px-5 py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/posts" className="text-sm text-fun-gray hover:text-fun-pink">
            ← Posts
          </Link>
          <h1 className="text-3xl font-bold mt-2">Edit post</h1>
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
          placeholder="Slug"
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
          placeholder="Body"
          rows={14}
          className="w-full rounded-lg bg-black/20 border border-fun-gray px-3 py-2 outline-none focus:border-fun-pink font-monospace text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-fun-gray">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 items-center">
          <button
            type="button"
            disabled={saving || !title}
            onClick={save}
            className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {slug && (
            <Link
              href={`/blog/${slug}`}
              className="text-sm text-fun-pink hover:underline"
              target="_blank">
              
                View public page
              
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
