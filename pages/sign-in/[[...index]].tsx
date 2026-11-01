import type { GetServerSideProps } from "next";
import AuthScreen from "@/components/auth/AuthScreen";
import Page from "@/components/utility/Page";

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
        <AuthScreen mode="sign-in" />
      </div>
    </Page>
  );
}
