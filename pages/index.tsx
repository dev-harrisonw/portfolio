import CTA from "@/components/home/CTA";
import Hero from "@/components/home/Hero";
import Page from "@/components/utility/Page";
import Projects from "@/components/home/Projects";
import Experience from "@/components/home/Experience";
import Skills from "@/components/home/Skills";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <Page currentPage="Home" meta={{ title: "Home", desc: "I'm a passionate web developer and designer coding beautiful websites and apps." }}>
      <Hero />
      <div className="mt-20 space-y-32">
        <Projects />
        <Experience />
        <Skills />
        <Testimonials />
      </div>
      <CTA />
    </Page>
  );
}
