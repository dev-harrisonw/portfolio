import Page from "@/components/utility/Page";
import Link from "next/link";
import { GetStaticProps } from "next";
import prisma from "@/lib/prisma";

type PostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
      },
    });

    return {
      props: {
        posts: posts.map((p) => ({
          ...p,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        })),
      },
      revalidate: 60,
    };
  } catch {
    return { props: { posts: [] }, revalidate: 60 };
  }
};

export default function BlogIndex({ posts }: { posts: PostCard[] }) {
  return (
    <Page
      currentPage="Blog"
      meta={{
        title: "Blog",
        desc: "Notes on building for the web.",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-16">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-fun-gray mb-10">
          Writing from the admin CMS. New posts appear here when published.
        </p>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-fun-gray p-6 text-fun-gray">
            No posts yet — check back soon, or{" "}
            <Link href="/hire" className="text-fun-pink hover:underline">
              start a project
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-xl font-bold hover:text-fun-pink transition-colors">

                  {post.title}

                </Link>
                {post.publishedAt && (
                  <p className="text-xs text-fun-gray mt-1">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                )}
                <p className="text-fun-gray text-sm mt-1">{post.excerpt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  );
}
