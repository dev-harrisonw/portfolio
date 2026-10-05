import Page from "@/components/utility/Page";
import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import prisma from "@/lib/prisma";

type PostView = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  publishedAt: string | null;
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return {
      paths: posts.map((p) => ({ params: { slug: p.slug } })),
      fallback: "blocking",
    };
  } catch {
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
    });
    if (!post) return { notFound: true, revalidate: 60 };

    return {
      props: {
        post: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body,
          publishedAt: post.publishedAt
            ? post.publishedAt.toISOString()
            : null,
        },
      },
      revalidate: 60,
    };
  } catch {
    return { notFound: true, revalidate: 60 };
  }
};

export default function BlogPostPage({ post }: { post: PostView }) {
  return (
    <Page
      currentPage="Blog"
      meta={{
        title: post.title,
        desc: post.excerpt || post.title,
      }}
    >
      <article className="max-w-2xl mx-auto px-5 py-16">
        <Link href="/blog" className="text-sm text-fun-gray hover:text-fun-pink">
          ← Blog
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-3">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-sm text-fun-gray mb-8">
            {new Date(post.publishedAt).toLocaleDateString()}
          </p>
        )}
        <div className="whitespace-pre-wrap leading-relaxed text-white/90">
          {post.body}
        </div>
      </article>
    </Page>
  );
}
