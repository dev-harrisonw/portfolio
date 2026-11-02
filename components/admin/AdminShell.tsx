import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import { AccountButton } from "@/components/auth/AccountButton";

type IconName = "dashboard" | "time" | "work" | "clients" | "invoices" | "finance" | "reports" | "posts" | "leads";

const groups: { label: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }] },
  {
    label: "Delivery",
    items: [
      { href: "/admin/time", label: "Time", icon: "time" },
      { href: "/admin/work", label: "Work", icon: "work" },
    ],
  },
  {
    label: "Clients",
    items: [
      { href: "/admin/clients", label: "Clients", icon: "clients" },
      { href: "/admin/invoices", label: "Invoices", icon: "invoices" },
      { href: "/admin/leads", label: "Leads", icon: "leads" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/finance", label: "Finance", icon: "finance" },
      { href: "/admin/reports", label: "Reports", icon: "reports" },
    ],
  },
  { label: "Content", items: [{ href: "/admin/posts", label: "Posts", icon: "posts" }] },
];

const flat = groups.flatMap((g) => g.items);
const tabHrefs = ["/admin", "/admin/time", "/admin/clients", "/admin/invoices"];
const tabs = tabHrefs.map((href) => flat.find((item) => item.href === href)!);
const moreItems = flat.filter((item) => !tabHrefs.includes(item.href));

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  time: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  work: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="10" rx="1" />
      <rect x="17" y="4" width="4" height="6" rx="1" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2" />
    </>
  ),
  invoices: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 13h7M9 17h5" />
    </>
  ),
  finance: <path d="M3 17l5-5 4 4 8-9M15 7h5v5" />,
  reports: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  posts: (
    <>
      <path d="M4 20h4l11-11-4-4L4 16z" />
      <path d="M13 7l4 4" />
    </>
  ),
  leads: (
    <>
      <path d="M3 13l3-8h12l3 8v6H3z" />
      <path d="M3 13h5l1 3h6l1-3h5" />
    </>
  ),
};

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {paths[name]}
    </svg>
  );
}

type Props = {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

export default function AdminShell({ title, eyebrow = "Admin", actions, children, wide }: Props) {
  const { pathname, asPath } = useRouter();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const max = wide ? "max-w-[1400px]" : "max-w-5xl";
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => isActive(item.href));

  useEffect(() => setMoreOpen(false), [asPath]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className="theme-dd min-h-screen overflow-x-clip">
      {/* Desktop sidebar */}
      <aside className="dd-sidebar hidden md:flex fixed inset-y-0 left-0 z-30 w-56 flex-col">
        <Link href="/admin" className="flex items-center gap-2.5 px-5 h-14 border-b border-[color:var(--dd-border)]">
          <img src="/static/logos/logo_no_text.svg" width={26} height={26} alt="" style={{ width: 26, height: 26 }} />
          <span className="font-bold tracking-tight">HarrisonW</span>
          <span className="ml-auto rounded bg-[color:var(--dd-raised)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fun-gray-light">
            Admin
          </span>
        </Link>
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Admin">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="dd-nav-group">{group.label}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dd-nav-link"
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-[color:var(--dd-border)] p-3 space-y-1">
          <Link href="/" className="dd-nav-link !mx-0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
            View site
          </Link>
          <Link href="/portal" className="dd-nav-link !mx-0">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
            </svg>
            Preview client portal
          </Link>
        </div>
      </aside>

      <div className="md:pl-56">
        {/* Top bar */}
        <header className="dd-topbar sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-12">
            <Link href="/admin" className="md:hidden flex items-center shrink-0" aria-label="Admin home">
              <img src="/static/logos/logo_no_text.svg" width={24} height={24} alt="" style={{ width: 24, height: 24 }} />
            </Link>
            {/* Phones show the page title here instead of a separate heading row. */}
            <div className="sm:hidden min-w-0 leading-tight">
              {eyebrow !== "Admin" && <p className="text-[10px] uppercase tracking-wider text-fun-gray-medium">{eyebrow}</p>}
              <p className="text-[15px] font-bold truncate">{title}</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-fun-gray-medium min-w-0">
              <span>{eyebrow}</span>
              <span aria-hidden>/</span>
              <span className="text-white font-semibold truncate">{title}</span>
            </div>
            <div className="ml-auto shrink-0 scale-90 origin-right">
              <AccountButton />
            </div>
          </div>
        </header>

        <main className={`${max} mx-auto px-3 sm:px-6 pt-3 sm:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8`}>
          <div className={`flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-3 sm:mb-6 ${actions ? "flex" : "hidden sm:flex"}`}>
            <h1 className="hidden sm:block text-2xl font-bold tracking-tight truncate min-w-0">{title}</h1>
            {actions && (
              <div className="flex gap-2 shrink-0 overflow-x-auto scroll-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible [&>*]:shrink-0">
                {actions}
              </div>
            )}
          </div>
          {children}
        </main>
      </div>

      {/* Phone tab bar */}
      {moreOpen && (
        <button type="button" aria-label="Close menu" className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMoreOpen(false)} />
      )}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--dd-border)] bg-[color:var(--dd-side)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Admin"
      >
        {moreOpen && (
          <div id="admin-more" className="border-b border-[color:var(--dd-border)] p-2 grid grid-cols-3 gap-1">
            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-md py-2.5 text-xs ${
                  isActive(item.href) ? "bg-[color:var(--dd-raised)] text-white font-semibold" : "text-fun-gray-light"
                }`}
              >
                <Icon name={item.icon} size={20} />
                {item.label}
              </Link>
            ))}
            <Link href="/portal" className="flex flex-col items-center gap-1 rounded-md py-2.5 text-xs text-fun-gray-light">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
              </svg>
              Portal
            </Link>
          </div>
        )}
        <div className="grid grid-cols-5">
          {tabs.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] ${
                isActive(item.href) ? "text-fun-pink font-semibold" : "text-fun-gray-light"
              }`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="admin-more"
            onClick={() => setMoreOpen((open) => !open)}
            className={`flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] ${
              moreActive || moreOpen ? "text-fun-pink font-semibold" : "text-fun-gray-light"
            }`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <circle cx="5" cy="12" r="1.2" />
              <circle cx="12" cy="12" r="1.2" />
              <circle cx="19" cy="12" r="1.2" />
            </svg>
            {moreActive && !moreOpen ? moreItems.find((item) => isActive(item.href))!.label : "More"}
          </button>
        </div>
      </nav>
    </div>
  );
}
