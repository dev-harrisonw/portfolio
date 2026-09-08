import Page from "@/components/utility/Page";
import Link from "next/link";
import { blogPosts } from "@/data/content/blog";

export default function BlogIndex() {
  const published = blogPosts.filter((post) => post.published);

  return (
    <Page
      currentPage="Blog"
      meta={{
        title: "Blog",
        desc: "Notes on building for the web—coming soon via the admin portal.",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-16">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-fun-gray mb-10">
          Articles will be published here from a Clerk-secured admin portal.
          The data model is ready; the CMS lands next.
        </p>
        {published.length === 0 ? (
          <div className="rounded-xl border border-fun-gray p-6 text-fun-gray">
            No posts yet — check back soon, or{" "}
            <Link href="/hire">
              <a className="text-fun-pink hover:underline">start a project</a>
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-6">
            {published.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`}>
                  <a className="text-xl font-bold hover:text-fun-pink transition-colors">
                    {post.title}
                  </a>
                </Link>
                <p className="text-fun-gray text-sm mt-1">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  );
}
