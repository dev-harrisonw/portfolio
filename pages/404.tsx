import Link from "next/link";
import React, { useState, useEffect } from "react";
import { randomNumberText } from "@/utils/utils";

function Page404() {
  const [num404, setNum404] = useState("0000");

  useEffect(() => {
    randomNumberText("404", setNum404);
  }, []);

  return <>
    {num404 !== "0000" && (
      <div className="min-h-screen w-full flex items-center justify-center flex-col animate-fadeIn px-5 text-center">
        <h1 className="text-7xl text-white font-monospace font-bold opacity-100">{`{ error: ${num404} }`}</h1>
        <p className="text-fun-gray text-xl mt-8 max-w-xl">
          Well, this is awkward. You&apos;ve hit a missing page—but the rest of
          the site still works.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <span className="border border-fun-pink-light text-base px-4 py-1 rounded-xl text-fun-pink-light bg-fun-pink-darkerer hover:bg-fun-pink hover:text-white transition-colors cursor-pointer">
              Return Home
            </span>
          </Link>
          <Link href="/projects">
            <span className="border border-fun-gray text-base px-4 py-1 rounded-xl text-fun-gray hover:border-fun-pink hover:text-fun-pink transition-colors cursor-pointer">
              Projects
            </span>
          </Link>
          <Link href="/hire">
            <span className="border border-fun-gray text-base px-4 py-1 rounded-xl text-fun-gray hover:border-fun-pink hover:text-fun-pink transition-colors cursor-pointer">
              Hire
            </span>
          </Link>
        </div>
        <p className="mt-6 text-xs text-fun-gray">
          Or press <kbd className="rounded border border-fun-gray px-1.5 py-0.5 font-monospace">⌘K</kbd> to open the command palette
        </p>
      </div>
    )}
  </>;
}

export default Page404;
