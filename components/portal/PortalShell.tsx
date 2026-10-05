import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

type Props = {
  clientName: string;
  adminPreview?: { clients: { id: string; name: string }[]; currentId: string } | null;
  children: ReactNode;
};

export default function PortalShell({ clientName, adminPreview, children }: Props) {
  return (
    <div className="min-h-screen bg-bg text-white">
      {adminPreview && (
        <div className="bg-fun-pink-darkest text-sm">
          <div className="max-w-5xl mx-auto px-5 py-2 flex flex-wrap items-center gap-3">
            <span className="text-fun-pink-light font-bold">Admin preview</span>
            <span className="text-fun-gray-light">This is what the client sees.</span>
            <select
              className="ml-auto rounded-md bg-black/30 border border-fun-pink-darker px-2 py-1"
              value={adminPreview.currentId}
              onChange={(e) => (window.location.href = `/portal?client=${e.target.value}`)}
            >
              {adminPreview.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin" className="text-fun-pink-light hover:underline">
              Back to admin
            </Link>
          </div>
        </div>
      )}
      <header className="border-b border-fun-gray-darker">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-4">
          <img src="/static/logos/logo_no_text.svg" width={36} alt="" />
          <div>
            <p className="text-xs uppercase tracking-widest text-fun-pink">Client portal</p>
            <p className="font-bold leading-tight">{clientName}</p>
          </div>
          <div className="ml-auto">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 py-10">{children}</main>
      <footer className="max-w-5xl mx-auto px-5 pb-10 text-xs text-fun-gray-medium">
        Questions about your hours or an invoice? Reply to any summary email or contact Harrison directly.
      </footer>
    </div>
  );
}
