import React from "react";
import Link from "next/link";
import { Link as ScrollLink } from "react-scroll";
import { site } from "@/data/content/home";
import DontPress from "./DontPress";

function Hero() {
  return <>
    <div
      className="relative heroElem w-full pt-20 pb-40 m-auto flex justify-center text-center flex-col items-center z-1"
      style={{ maxWidth: "1200px" }}
    >
      {site.availableForWork && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fun-pink/50 bg-fun-pink-darkerer px-3 py-1 text-xs font-medium text-fun-pink">
          <span className="h-1.5 w-1.5 rounded-full bg-fun-pink animate-pulse" />
          Available for work
        </div>
      )}
      <p className="text-xl mb-5">Hi, I'm Harrison.</p>
      <h1 className="heroTitle inline-block max-w-2xl lg:max-w-4xl  w-auto relative text-5xl md:text-6xl lg:text-7xl tracking-tighter mb-10 font-bold heroShinyBg">
        I enjoy <span className="heroShiny1 text-fun-pink">exploring</span> and{" "}
        <span className="heroShiny2 text-fun-pink">building</span> the
        web.
        <img
          className="sqD squiggle-hero-html w-12 top-[-70px] right-[4%] sm:w-16 sm:top-[-90px] sm:right-[170px]"
          style={{ animationDelay: "0.1s" }}
          src="/static/doodles/hero/html.svg"
        />
        <img
          className="sqD squiggle-hero-nextjs hidden top-[75px] right-0 w-11"
          style={{ animationDelay: "0.2s" }}
          src="/static/doodles/hero/nextjs.svg"
        />
        <img
          className="sqD bottom-[-180px] right-[-8px] w-[180px] sm:bottom-[-280px] sm:right-[-8%] sm:w-[280px] lg:bottom-[-300px] lg:right-[-40px] lg:w-[360px]"
          style={{ animationDelay: "0.3s" }}
          src="/static/doodles/hero/harrison.svg"
        />
        <img
          className="sqD hidden sm:block bottom-[-340px] left-[-120px]"
          style={{ animationDelay: "0.4s" }}
          src="/static/doodles/hero/coder.svg"
        />
        <img
          className="sqD hidden sm:block left-[100px] lg:left-[160px] bottom-[-150px]"
          style={{ animationDelay: "0.5s" }}
          src="/static/doodles/hero/js.svg"
        />
        <img
          className="sqD bottom-[-200px] right-[55%] w-16 sm:bottom-[-320px] sm:right-[45%] sm:w-auto"
          style={{ animationDelay: "0.6s" }}
          src="/static/doodles/hero/dino.svg"
        />
        <img
          className="sqD right-[-8px] bottom-[-120px] w-16 sm:right-0 sm:bottom-[-180px] sm:w-auto lg:right-[5%]"
          style={{ animationDelay: "0.7s" }}
          src="/static/doodles/hero/paintbrush.svg"
        />
        <img
          className="sqD squiggle-hero-pop1 hidden sm:block sm:top-[-130px] sm:left-[15%] lg:top-[-130px] lg:left-[120px]"
          src="/static/doodles/hero/pop1.svg"
        />
        <img
          className="sqD left-[-8px] bottom-[-70px] w-10 sm:bottom-[-100px] sm:left-5 sm:w-auto opacity-40"
          style={{ animationDelay: "0.9s" }}
          src="/static/doodles/hero/code.svg"
        />
        <DontPress />
      </h1>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <ScrollLink
          activeClass="active"
          to="learnmore"
          spy={true}
          offset={-30}
          smooth={true}
          duration={500}
        >
          <div className="cursor-pointer font-bold whitespace-nowrap px-10 py-4 text-fun-white border-2 text-xl rounded-full border-fun-white bg-bg hover:bg-fun-pink hover:text-white hover:border-fun-pink transition-colors">
            Tell me more
          </div>
        </ScrollLink>
        <Link
          href="/hire"
          className="cursor-pointer font-bold whitespace-nowrap px-10 py-4 text-fun-pink border-2 text-xl rounded-full border-fun-pink bg-bg hover:bg-fun-pink hover:text-white transition-colors">
          
            Start a project
          
        </Link>
      </div>
      <p className="mt-4 text-xs text-fun-gray">
        Tip: press <kbd className="rounded border border-fun-gray px-1.5 py-0.5 font-monospace">⌘K</kbd> to jump anywhere
      </p>
    </div>
  </>;
}

export default Hero;
