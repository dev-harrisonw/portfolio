import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthFormStatus from "@/components/auth/AuthFormStatus";
import { safeInternalPath } from "@/lib/safePath";

const RETRY_KEY = "portal-auth-retry";

type Mode = "sign-in" | "sign-up";

function retryMarker(dest: string) {
  try {
    return sessionStorage.getItem(RETRY_KEY) === dest ? sessionStorage.getItem(`${RETRY_KEY}-at`) : null;
  } catch {
    return null;
  }
}

function rememberRetry(dest: string) {
  try {
    sessionStorage.setItem(RETRY_KEY, dest);
    sessionStorage.setItem(`${RETRY_KEY}-at`, String(Date.now()));
  } catch {
    // Private mode can block storage. The navigation still runs once.
  }
}

function clearRetry() {
  try {
    sessionStorage.removeItem(RETRY_KEY);
    sessionStorage.removeItem(`${RETRY_KEY}-at`);
  } catch {
    // Ignore storage failures.
  }
}

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [mounted, setMounted] = useState(false);
  const [stuck, setStuck] = useState(false);

  const dest = safeInternalPath(router.query.redirect_url, "/portal");
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(dest)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(dest)}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !router.isReady || !isLoaded || !isSignedIn) return;
    let cancelled = false;

    (async () => {
      const data = await fetch("/api/account")
        .then((res) => res.json())
        .catch(() => null);
      if (cancelled) return;

      if (data?.signedIn) {
        clearRetry();
        window.location.replace(dest);
        return;
      }

      const at = Number(retryMarker(dest));
      if (at && Date.now() - at < 15000) {
        setStuck(true);
        return;
      }

      rememberRetry(dest);
      window.location.replace(dest);
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted, router.isReady, isLoaded, isSignedIn, dest]);

  if (!mounted || !isLoaded || (isSignedIn && !stuck)) {
    return <AuthFormStatus message={isSignedIn ? "Opening your portal…" : undefined} />;
  }

  if (stuck) {
    return (
      <div className="max-w-sm text-center">
        <p className="font-bold text-white">This session didn&apos;t reach the portal</p>
        <p className="mt-2 text-sm leading-relaxed text-fun-gray-light">
          You&apos;re signed in, but Admin and the client portal couldn&apos;t confirm it. Sign out, then sign in again
          with the same email.
        </p>
        <button
          type="button"
          className="mt-6 rounded-full bg-fun-pink px-5 py-2 text-sm font-bold text-white"
          onClick={() => {
            clearRetry();
            void signOut({ redirectUrl: signInUrl });
          }}
        >
          Sign out and try again
        </button>
      </div>
    );
  }

  return (
    <>
      <ClerkLoading>
        <AuthFormStatus />
      </ClerkLoading>
      <ClerkLoaded>
        {mode === "sign-in" ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl={signUpUrl}
            fallbackRedirectUrl={dest}
            signUpFallbackRedirectUrl={dest}
            fallback={<AuthFormStatus />}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl={signInUrl}
            fallbackRedirectUrl={dest}
            signInFallbackRedirectUrl={dest}
            fallback={<AuthFormStatus />}
          />
        )}
      </ClerkLoaded>
    </>
  );
}
