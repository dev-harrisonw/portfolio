import Link from "next/link";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";

const signInClass =
  "rounded-full bg-fun-pink px-4 py-2 text-sm font-bold text-white hover:bg-fun-pink-light transition-colors whitespace-nowrap";

function SignInLink() {
  return (
    <Link href="/sign-in" className={signInClass}>
      Sign in
    </Link>
  );
}

function AccountInner() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) {
    return (
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "h-9 w-9 ring-2 ring-fun-pink/50",
            userButtonPopoverCard: "bg-fun-gray-darkest border border-fun-gray-darker",
          },
        }}
      />
    );
  }
  return <SignInLink />;
}

export function AccountButton() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return <SignInLink />;
  return (
    <div className="flex items-center shrink-0">
      <AccountInner />
    </div>
  );
}

function SignedOutCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest p-4 text-left">
      <p className="text-[11px] uppercase tracking-widest text-fun-pink font-bold">
        Client portal
      </p>
      <p className="mt-1 text-sm text-fun-gray">
        Sign in to view hours, invoices, and project updates.
      </p>
      <Link
        href="/sign-in"
        onClick={onNavigate}
        className="mt-4 inline-flex w-full justify-center rounded-full bg-fun-pink px-4 py-2.5 text-sm font-bold text-white"
      >
        Sign in
      </Link>
    </div>
  );
}

function MobileProfileInner({ onNavigate }: { onNavigate?: () => void }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  if (!isLoaded) {
    return (
      <div className="h-[148px] rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest animate-pulse" />
    );
  }

  if (!isSignedIn || !user) {
    return <SignedOutCard onNavigate={onNavigate} />;
  }

  const email = user.primaryEmailAddress?.emailAddress;
  const isAdmin = (user.publicMetadata as { role?: string } | undefined)?.role === "admin";

  return (
    <div className="rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest p-4 text-left">
      <div className="flex items-center gap-3">
        <img
          src={user.imageUrl}
          alt=""
          className="h-12 w-12 rounded-full object-cover ring-2 ring-fun-pink/40"
        />
        <div className="min-w-0">
          <p className="font-bold truncate">{user.fullName || "Account"}</p>
          {email && <p className="text-xs text-fun-gray truncate">{email}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/portal"
          onClick={onNavigate}
          className="rounded-full border border-fun-gray-darker px-3 py-2 text-center text-sm font-bold hover:border-fun-pink hover:text-fun-pink transition-colors"
        >
          Portal
        </Link>
        {isAdmin ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="rounded-full border border-fun-gray-darker px-3 py-2 text-center text-sm font-bold hover:border-fun-pink hover:text-fun-pink transition-colors"
          >
            Admin
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="rounded-full border border-fun-gray-darker px-3 py-2 text-sm font-bold hover:border-fun-pink hover:text-fun-pink transition-colors"
          >
            Manage
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={() => openUserProfile()}
            className="rounded-full border border-fun-gray-darker px-3 py-2 text-sm font-bold hover:border-fun-pink hover:text-fun-pink transition-colors"
          >
            Manage
          </button>
        )}
        <button
          type="button"
          onClick={() => signOut({ redirectUrl: "/" })}
          className={`rounded-full bg-fun-pink px-3 py-2 text-sm font-bold text-white ${
            isAdmin ? "" : "col-span-2"
          }`}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function MobileProfileCard({ onNavigate }: { onNavigate?: () => void }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <SignedOutCard onNavigate={onNavigate} />;
  }
  return <MobileProfileInner onNavigate={onNavigate} />;
}
