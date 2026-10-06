import Link from "next/link";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Field, Input, inputClass } from "@/components/admin/Form";

export const getServerSideProps: GetServerSideProps = async (ctx) => requireAdminPage(ctx);

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
    <AdminShell
      title="New post"
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
        <Field label="Slug" hint="Leave blank to generate from the title">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="optional-slug" className="font-monospace text-sm" />
        </Field>
        <Field label="Excerpt">
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" rows={2} className={inputClass} />
        </Field>
        <Field label="Body">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body (Markdown / plain text)"
            rows={14}
            className={`${inputClass} font-monospace text-sm`}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-fun-gray">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Publish now
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button disabled={saving || !title} onClick={save}>
          {saving ? "Saving…" : "Create post"}
        </Button>
      </div>
    </AdminShell>
  );
}
