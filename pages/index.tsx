import CTA from "@/components/home/CTA";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Page from "@/components/utility/Page";
import Projects from "@/components/home/Projects";
import Experience from "@/components/home/Experience";
import Skills from "@/components/home/Skills";
import GitHubActivity from "@/components/home/GitHubActivity";
import Testimonials from "@/components/home/Testimonials";

export default function Home() {
  return (
    <Page
      currentPage="Home"
      meta={{
        title: "Home",
        desc: "I'm a passionate web developer and designer coding beautiful websites and apps.",
      }}
    >
      <Hero />
      <div className="relative z-10 mt-28 md:mt-40 space-y-32 w-full min-w-0 text-left">
        <About />
        <Projects />
        <div id="experience">
          <Experience />
        </div>
        <div id="skills">
          <Skills />
        </div>
        <GitHubActivity />
        <Testimonials />
      </div>
      <CTA />
    </Page>
  );
}
