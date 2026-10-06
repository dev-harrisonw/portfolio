import Link from "next/link";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Field, Input, inputClass } from "@/components/admin/Form";

export const getServerSideProps: GetServerSideProps = async (ctx) => requireAdminPage(ctx);

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
    }
  };

  if (!loaded && !error) {
    return (
      <AdminShell title="Edit post">
        <p className="text-fun-gray">Loading…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Edit post"
      actions={
        <Link href="/admin/posts" className="text-sm text-fun-gray hover:text-fun-pink">
          ← Posts
        </Link>
      }
    >
      <div className="space-y-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        </Field>
        <Field label="Slug">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="font-monospace text-sm" />
        </Field>
        <Field label="Excerpt">
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" rows={2} className={inputClass} />
        </Field>
        <Field label="Body">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={14} className={`${inputClass} font-monospace text-sm`} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-fun-gray">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 items-center">
          <Button disabled={saving || !title} onClick={save}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {slug && (
            <Link href={`/blog/${slug}`} className="text-sm text-fun-pink hover:underline" target="_blank">
              View public page
            </Link>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
