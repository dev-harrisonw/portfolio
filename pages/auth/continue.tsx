import { useAuth } from "@clerk/nextjs";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { safeInternalPath } from "@/lib/safePath";

/**
 * Post-sign-in fork, copied from WeSharp's `/auth/continue`.
 * Wait until the browser session exists, ask the server who this login is, then
 * send staff to admin and clients to the portal.
 */
function Continue() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !isLoaded) return;

    const returnTo = safeInternalPath(router.query.returnTo, "");
    if (!userId) {
      const back = returnTo ? `/auth/continue?returnTo=${encodeURIComponent(returnTo)}` : "/auth/continue";
      window.location.replace(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
      return;
    }

    let cancelled = false;
    fetch("/api/account")
      .then((res) => res.json())
      .then((data: { signedIn?: boolean; isAdmin?: boolean; hasPortal?: boolean }) => {
        if (cancelled) return;
        if (!data?.signedIn) {
          setProblem("You're signed in, but the portal couldn't confirm this session. Sign out and try again.");
          return;
        }
        if (returnTo) {
          window.location.replace(returnTo);
          return;
        }
        if (data.isAdmin) {
          window.location.replace("/admin");
          return;
        }
        window.location.replace(data.hasPortal ? "/portal" : "/portal/no-access");
      })
      .catch(() => {
        if (!cancelled) setProblem("Couldn't reach your account. Refresh and try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, router.isReady, router.query.returnTo, userId]);

  return <Status message={problem ?? "Preparing your session…"} />;
}

function Status({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fun-gray-light">
      <Head>
        <title>Signing you in</title>
        <meta name="robots" content="noindex" />
      </Head>
      <p className="text-sm">{message}</p>
    </div>
  );
}

/** Without Clerk keys there is no ClerkProvider, so the hooks above must never mount (and the build must not prerender them). */
export default function AuthContinuePage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <Status message="Sign-in isn't configured on this site." />;
  return <Continue />;
}
