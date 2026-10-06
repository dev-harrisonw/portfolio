import Link from "next/link";
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const signInClass =
  "rounded-full border border-fun-gray-darker px-4 py-1.5 text-sm text-white hover:border-fun-pink hover:text-fun-pink transition-colors";

function SignInLink() {
  return (
    <Link href="/sign-in" className={signInClass}>
      Sign in
    </Link>
  );
}

export function AccountButton() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;

  return (
    <div className="flex items-center shrink-0">
      <ClerkLoading>
        <SignInLink />
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          <SignInLink />
        </SignedOut>
        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-2 ring-fun-pink/50",
                userButtonPopoverCard: "bg-fun-gray-darkest border border-fun-gray-darker",
              },
            }}
          />
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}
