import "tailwindcss/tailwind.css";
import "@/styles/main.css";
import "nprogress/nprogress.css";

import { AppProps } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";
import RouteProgress from "@/components/utility/RouteProgress";
import CommandPalette from "@/components/global/CommandPalette";

export default function App({ Component, pageProps }: AppProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const tree = (
    <>
      <RouteProgress />
      <CommandPalette />
      <Component {...pageProps} />
    </>
  );

  if (!publishableKey) {
    return tree;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} {...pageProps}>
      {tree}
    </ClerkProvider>
  );
}
