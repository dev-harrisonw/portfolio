import Page from "@/components/utility/Page";
import Link from "next/link";
import HireAssistant from "@/components/hire/HireAssistant";

export default function HirePage() {
  return (
    <Page
      currentPage="Hire"
      meta={{
        title: "Start a project",
        desc: "Tell me about your website or product idea and I'll help shape the next step.",
      }}
    >
      <div className="max-w-2xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <p className="text-fun-pink text-sm uppercase tracking-widest mb-3">
            Hire
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let&apos;s get your site live.
          </h1>
          <p className="text-fun-gray text-lg leading-relaxed">
            Tell me what you need, when you need it, and a rough budget. I&apos;ll turn it into a clear brief and reply by email.
          </p>
        </div>
        <HireAssistant />
        <p className="text-center mt-8 text-sm text-fun-gray">
          Prefer email?{" "}
          <a
            href="mailto:me@harrisonwarburton.com"
            className="text-fun-pink hover:underline"
          >
            me@harrisonwarburton.com
          </a>
          {" · "}
          <Link href="/projects" className="text-fun-pink hover:underline">
            See projects
          </Link>
        </p>
      </div>
    </Page>
  );
}
