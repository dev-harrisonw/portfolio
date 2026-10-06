import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { AccountButton } from "@/components/auth/AccountButton";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/time", label: "Time" },
  { href: "/admin/work", label: "Work" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/leads", label: "Leads" },
];

type Props = {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

function NavLinks({ pathname }: { pathname: string }) {
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-3 py-1.5 whitespace-nowrap text-sm transition-colors ${
            isActive(item.href) ? "bg-fun-pink-dark text-white" : "text-fun-gray-light hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export default function AdminShell({ title, eyebrow = "Admin", actions, children, wide }: Props) {
  const { pathname } = useRouter();
  const max = wide ? "max-w-6xl" : "max-w-4xl";

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-clip">
      <header className="sticky top-0 z-20 border-b border-fun-gray-darker bg-bg/90 backdrop-blur-md">
        <div className={`${max} mx-auto px-4 sm:px-5`}>
          <div className="flex items-center gap-3 min-h-[52px]">
            <Link href="/" className="text-sm font-bold text-fun-pink shrink-0">
              HW
            </Link>
            <nav className="hidden md:flex gap-1 text-sm min-w-0">
              <NavLinks pathname={pathname} />
            </nav>
            <div className="ml-auto shrink-0">
              <AccountButton />
            </div>
          </div>
          <nav className="md:hidden flex gap-1 overflow-x-auto scroll-hide -mx-4 px-4 pb-2.5">
            <NavLinks pathname={pathname} />
          </nav>
        </div>
      </header>
      <main className={`${max} mx-auto px-4 sm:px-5 py-6 sm:py-10`}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <p className="text-fun-pink text-xs sm:text-sm uppercase tracking-widest">{eyebrow}</p>
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{title}</h1>
          </div>
          {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
