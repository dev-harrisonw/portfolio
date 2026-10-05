import { SignIn } from "@clerk/nextjs";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
