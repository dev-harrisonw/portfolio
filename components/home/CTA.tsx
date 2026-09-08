import React from "react";
import Link from "next/link";

function CTA() {
  return (
    <div className="pt-36 relative w-full">
      <img className="w-30 m-auto mb-2" src="/static/doodles/lineBreak.svg" />
      <div className="pt-14 pb-40">
        <h2 className="text-4xl md:text-5xl font-bold mb-10">
          Interested in Working Together?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/hire">
            <a
              className="cursor-pointer font-bold whitespace-nowrap 
            px-8 py-3 text-white border-2 rounded-full border-fun-pink bg-fun-pink hover:opacity-90 transition-opacity"
            >
              Start a project
            </a>
          </Link>
          <a
            href="mailto:me@harrisonwarburton.com"
            className="cursor-pointer font-bold whitespace-nowrap 
          px-8 py-3 text-white border-2 rounded-full border-white bg-bg hover:bg-fun-pink hover:border-fun-pink transition-colors"
          >
            Email me
          </a>
        </div>
      </div>

      <img
        className="sqD min-w-[800px] bottom-[-100px] left-1/2 sm:bottom-[-150px] -translate-x-1/2 object-cover sm:min-w-[1100px]"
        style={{ zIndex: "-10" }}
        src="/static/doodles/hero/fancyLines.svg"
      />
    </div>
  );
}

export default CTA;
