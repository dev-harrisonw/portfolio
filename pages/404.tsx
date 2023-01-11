import Link from "next/link";
import React, { useState } from "react";
import { randomNumberText } from "@/utils/utils";
import { useEffect } from "react";

function Page404() {
  const [num404, setNum404] = useState("0000");

  useEffect(() => {
    randomNumberText("404", setNum404);
  }, []);

  return (
    <>
      {num404 !== "0000" && (
        <div className="min-h-screen w-full flex items-center justify-center flex-col animate-fadeIn">
          <h1 className="text-7xl text-white font-monospace font-bold opacity-100">{`{ error: ${num404} }`}</h1>
          <p className="text-fun-gray text-xl mt-8 flex items-center">
          Well, this is awkward. You've encountered a glitch in the matrix. But don't blame yourself, it's not your fault Neo, the code is just buggy.&nbsp;&nbsp;
          </p>
          <a href="https://www.harrisonwarburton.com/" class="cursor-pointer font-bold whitespace-nowrap mt-6 px-8 py-3 text-white border-2 rounded-full border-white bg-bg hover:bg-fun-pink hover:border-fun-pink transition-colors">Return Home</a>
        </div>
      )}
    </>
  );
}

export default Page404;
