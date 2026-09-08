import React from "react";
import { site } from "@/data/content/home";
import { MotionItem, MotionSection } from "../utility/Motion";

function About() {
  return (
    <MotionSection className="relative max-w-3xl mx-auto text-center md:text-left px-1">
      <MotionItem>
        <p className="text-sm uppercase tracking-widest text-fun-pink mb-3">
          About
        </p>
        <p className="text-xl md:text-2xl leading-relaxed text-white/90">
          {site.about}
        </p>
        <p className="mt-4 text-sm text-fun-gray">
          {site.location}
          {site.focus ? ` · ${site.focus}` : ""}
        </p>
      </MotionItem>
    </MotionSection>
  );
}

export default About;
