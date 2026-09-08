import Page from "@/components/utility/Page";
import Link from "next/link";

export default function HirePage() {
  return (
    <Page
      currentPage="Hire"
      meta={{
        title: "Start a project",
        desc: "Tell me about your website or product idea and I'll help shape the next step.",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <p className="text-fun-pink text-sm uppercase tracking-widest mb-3">
          Hire
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          I&apos;ll help you ship the website.
        </h1>
        <p className="text-fun-gray text-lg mb-10 leading-relaxed">
          A guided enquiry assistant is coming next—for now, email works best.
          Share what you&apos;re building, timeline, and budget band, and I&apos;ll
          get back to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:me@harrisonwarburton.com?subject=Project%20enquiry"
            className="px-8 py-3 rounded-full border-2 border-fun-pink bg-fun-pink text-white font-bold hover:opacity-90 transition-opacity"
          >
            Email an enquiry
          </a>
          <Link href="/projects">
            <a className="px-8 py-3 rounded-full border-2 border-white text-white font-bold hover:bg-fun-pink hover:border-fun-pink transition-colors">
              See projects
            </a>
          </Link>
        </div>
      </div>
    </Page>
  );
}
