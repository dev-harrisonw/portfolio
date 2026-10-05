import Link from "next/link";
import { useRouter } from "next/router";
import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/time", label: "Time" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/invoices", label: "Invoices" },
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

export default function AdminShell({ title, eyebrow = "Admin", actions, children, wide }: Props) {
  const { pathname } = useRouter();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="border-b border-fun-gray-darker">
        <div className={`${wide ? "max-w-6xl" : "max-w-4xl"} mx-auto px-5 py-4 flex items-center gap-6`}>
          <Link href="/" className="text-sm font-bold text-fun-pink shrink-0">
            HW
          </Link>
          <nav className="flex gap-1 overflow-x-auto text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 whitespace-nowrap transition-colors ${
                  isActive(item.href) ? "bg-fun-pink-dark text-white" : "text-fun-gray-light hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className={`${wide ? "max-w-6xl" : "max-w-4xl"} mx-auto px-5 py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-fun-pink text-sm uppercase tracking-widest">{eyebrow}</p>
            <h1 className="text-3xl font-bold">{title}</h1>
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
