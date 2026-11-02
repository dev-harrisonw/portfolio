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
    <div className="theme-dd min-h-screen overflow-x-clip">
      {adminPreview && (
        <div className="bg-fun-pink-darkest/80 border-b border-fun-pink-darker text-sm">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-3">
            <span className="text-fun-pink-light font-bold shrink-0">
              <span className="sm:hidden">Preview</span>
              <span className="hidden sm:inline">Admin preview</span>
            </span>
            <span className="hidden sm:inline text-fun-gray-light">This is what the client sees.</span>
            <select
              aria-label="Preview client"
              className="dd-input sm:ml-auto min-w-0 flex-1 sm:flex-none sm:w-auto px-2 py-1.5 text-base sm:text-sm"
              value={adminPreview.currentId}
              onChange={(e) => (window.location.href = `/portal?client=${e.target.value}`)}
            >
              {adminPreview.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Link href="/admin" className="text-fun-pink-light hover:underline py-1 shrink-0">
              <span className="sm:hidden">Admin</span>
              <span className="hidden sm:inline">Back to admin</span>
            </Link>
          </div>
        </div>
      )}
      <header className="dd-topbar sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center gap-3">
          <img src="/static/logos/logo_no_text.svg" width={28} height={28} alt="" className="shrink-0" style={{ width: 28, height: 28 }} />
          <div className="min-w-0 leading-tight">
            <p className="font-semibold truncate">{clientName}</p>
            <p className="text-[11px] text-fun-gray-medium">Project &amp; billing overview</p>
          </div>
          <div className="ml-auto shrink-0 scale-90 origin-right">
            <AccountButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-8">{children}</main>
      <footer className="max-w-6xl mx-auto px-3 sm:px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-10 text-xs text-fun-gray-medium leading-relaxed">
        Questions about your hours or an invoice? Reply to any summary email or contact Harrison directly.
      </footer>
    </div>
  );
}
