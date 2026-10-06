import Head from "next/head";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default function PortalNoAccess() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return (
    <div className="min-h-screen bg-bg text-white flex items-center justify-center px-5">
      <Head>
        <title>No portal access</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="max-w-md text-center">
        <p className="text-fun-pink text-sm uppercase tracking-widest">Client portal</p>
        <h1 className="text-3xl font-bold mt-2">This login isn&apos;t linked to a client</h1>
        <p className="text-fun-gray-light mt-4">
          Sign in with the email address your invitation was sent to. If you think this is a mistake, get in touch and
          I&apos;ll add you.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {clerkEnabled ? (
            <SignOutButton redirectUrl="/sign-in?redirect_url=/portal">
              <button type="button" className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold">
                Use a different account
              </button>
            </SignOutButton>
          ) : (
            <Link href="/sign-in?redirect_url=/portal" className="rounded-full bg-fun-pink px-5 py-2 text-sm font-bold">
              Use a different account
            </Link>
          )}
          <Link href="/" className="rounded-full border border-fun-gray-darker px-5 py-2 text-sm">
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
