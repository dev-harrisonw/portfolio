import "tailwindcss/tailwind.css";
import "@/styles/main.css";
import "nprogress/nprogress.css";

import { AppProps } from "next/app";
import RouteProgress from "@/components/utility/RouteProgress";
import CommandPalette from "@/components/global/CommandPalette";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <RouteProgress />
      <CommandPalette />
      <Component {...pageProps} />
    </>
  );
}
