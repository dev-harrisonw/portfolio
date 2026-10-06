import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { site } from "@/data/content/home";
import SectionTitle from "../global/SectionTitle";
import { fadeUp } from "@/utils/motion";

function About() {
  const reduce = useReducedMotion();

  return (
    <motion.section
      className="relative z-10 w-full text-left"
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
    >
      <SectionTitle title="A bit about me." />
      <p className="text-xl md:text-2xl leading-relaxed text-white/90 max-w-3xl">
        {site.about}
      </p>
      <p className="mt-4 text-sm text-fun-gray">
        {site.location}
        {site.focus ? ` · ${site.focus}` : ""}
      </p>
    </motion.section>
  );
}

export default About;
