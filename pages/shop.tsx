import Page from "@/components/utility/Page";
import Link from "next/link";

/** Sprint 6 placeholder — Stripe products when there's something to sell. */
export default function ShopPage() {
  return (
    <Page
      currentPage="Shop"
      meta={{
        title: "Shop",
        desc: "Digital products and courses — coming soon.",
      }}
    >
      <div className="max-w-xl mx-auto px-5 py-20 text-center">
        <p className="text-fun-pink text-sm uppercase tracking-widest mb-3">
          Shop
        </p>
        <h1 className="text-4xl font-bold mb-4">Coming soon</h1>
        <p className="text-fun-gray mb-8 leading-relaxed">
          This is reserved for downloadable files, courses, and other digital
          products via Stripe. Nothing for sale yet.
        </p>
        <Link href="/hire">
          <a className="rounded-full bg-fun-pink px-6 py-3 font-bold text-white inline-block">
            Need something custom instead?
          </a>
        </Link>
      </div>
    </Page>
  );
}
