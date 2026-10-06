import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import type { GetServerSideProps } from "next";
import Page from "@/components/utility/Page";
import AuthFormStatus from "@/components/auth/AuthFormStatus";

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <Page currentPage="Sign in" meta={{ title: "Sign in", desc: "Sign in to the client portal." }}>
        <p className="py-16 text-fun-gray-light">Sign in is not configured.</p>
      </Page>
    );
  }

  return (
    <Page currentPage="Sign in" meta={{ title: "Sign in", desc: "Sign in to the client portal." }}>
      <div className="flex justify-center py-12 sm:py-16 text-left">
        <ClerkLoading>
          <AuthFormStatus />
        </ClerkLoading>
        <ClerkLoaded>
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        </ClerkLoaded>
      </div>
    </Page>
  );
}
