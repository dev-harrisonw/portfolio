import type { GetServerSideProps } from "next";
import AuthScreen from "@/components/auth/AuthScreen";
import Page from "@/components/utility/Page";

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <Page currentPage="Sign up" meta={{ title: "Sign up", desc: "Create a client portal account." }}>
        <p className="py-16 text-fun-gray-light">Sign up is not configured.</p>
      </Page>
    );
  }

  return (
    <Page currentPage="Sign up" meta={{ title: "Sign up", desc: "Create a client portal account." }}>
      <div className="flex justify-center py-12 sm:py-16 text-left">
        <AuthScreen mode="sign-up" />
      </div>
    </Page>
  );
}
