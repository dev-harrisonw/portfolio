import { ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthFormStatus from "@/components/auth/AuthFormStatus";
import { safeInternalPath } from "@/lib/safePath";

type Mode = "sign-in" | "sign-up";

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  const returnTo = safeInternalPath(router.query.redirect_url, "");
  const continueUrl = returnTo ? `/auth/continue?returnTo=${encodeURIComponent(returnTo)}` : "/auth/continue";
  const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(continueUrl)}`;
  const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(continueUrl)}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !router.isReady || !isLoaded || !isSignedIn) return;
    window.location.replace(continueUrl);
  }, [continueUrl, isLoaded, isSignedIn, mounted, router.isReady]);

  if (!mounted || !isLoaded || isSignedIn) {
    return <AuthFormStatus message={isSignedIn ? "Preparing your session…" : undefined} />;
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
            forceRedirectUrl={continueUrl}
            fallbackRedirectUrl={continueUrl}
            signUpForceRedirectUrl={continueUrl}
            signUpFallbackRedirectUrl={continueUrl}
            fallback={<AuthFormStatus />}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl={signInUrl}
            forceRedirectUrl={continueUrl}
            fallbackRedirectUrl={continueUrl}
            signInForceRedirectUrl={continueUrl}
            signInFallbackRedirectUrl={continueUrl}
            fallback={<AuthFormStatus />}
          />
        )}
      </ClerkLoaded>
    </>
  );
}
