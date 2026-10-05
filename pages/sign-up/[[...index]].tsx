import { SignUp } from "@clerk/nextjs";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </div>
  );
}
