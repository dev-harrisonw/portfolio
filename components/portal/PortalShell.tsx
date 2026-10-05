import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton } from "@/components/auth/AccountButton";

type Props = {
  clientName: string;
  adminPreview?: { clients: { id: string; name: string }[]; currentId: string } | null;
  children: ReactNode;
};

export default function PortalShell({ clientName, adminPreview, children }: Props) {
  return (
    <div className="min-h-screen bg-bg text-white overflow-x-clip">
      {adminPreview && (
        <div className="bg-fun-pink-darkest text-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-5 py-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-fun-pink-light font-bold">Admin preview</span>
            <span className="hidden sm:inline text-fun-gray-light">This is what the client sees.</span>
            <select
              className="sm:ml-auto w-full sm:w-auto rounded-md bg-black/30 border border-fun-pink-darker px-2 py-2 text-base sm:text-sm"
              value={adminPreview.currentId}
              onChange={(e) => (window.location.href = `/portal?client=${e.target.value}`)}
            >
              {adminPreview.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin" className="text-fun-pink-light hover:underline py-1">
              Back to admin
            </Link>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-fun-gray-darker bg-bg/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <img src="/static/logos/logo_no_text.svg" width={32} alt="" className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-fun-pink">Client portal</p>
            <p className="font-bold leading-tight truncate">{clientName}</p>
          </div>
          <div className="ml-auto shrink-0">
            <AccountButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-5 py-6 sm:py-10">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 sm:px-5 pb-8 sm:pb-10 text-xs text-fun-gray-medium leading-relaxed">
        Questions about your hours or an invoice? Reply to any summary email or contact Harrison directly.
      </footer>
    </div>
  );
}
