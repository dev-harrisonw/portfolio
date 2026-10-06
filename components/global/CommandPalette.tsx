import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

type Command = {
  id: string;
  label: string;
  hint?: string;
  href: string;
};

const commands: Command[] = [
  { id: "home", label: "Home", href: "/", hint: "Go to homepage" },
  { id: "projects", label: "Projects", href: "/projects", hint: "All work" },
  { id: "hire", label: "Hire / Start a project", href: "/hire", hint: "Enquiry" },
  { id: "experience", label: "Experience", href: "/#experience", hint: "Work history" },
  { id: "skills", label: "Skills", href: "/#skills", hint: "Toolbelt" },
  { id: "blog", label: "Blog", href: "/blog", hint: "Writing" },
  { id: "admin", label: "Admin", href: "/admin", hint: "CMS" },
  { id: "work", label: "Work board", href: "/admin/work", hint: "Tasks and overdue builds" },
  { id: "finance", label: "Finance", href: "/admin/finance", hint: "Cash and invoices" },
  { id: "reports", label: "Reports", href: "/admin/reports", hint: "Profitability this year" },
  { id: "expenses", label: "Expenses", href: "/admin/expenses", hint: "Costs and P&L" },
  { id: "leads", label: "Leads", href: "/admin/leads", hint: "Hire enquiries" },
  { id: "signin", label: "Sign in", href: "/sign-in", hint: "Client portal" },
  { id: "shop", label: "Shop", href: "/shop", hint: "Coming soon" },
];

function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        (cmd.hint && cmd.hint.toLowerCase().includes(q))
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const run = useCallback(
    (cmd: Command) => {
      close();
      router.push(cmd.href);
    },
    [close, router]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isPalette =
        (event.key === "k" || event.key === "K") &&
        (event.metaKey || event.ctrlKey);

      if (isPalette) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (event.key === "Enter" && filtered[active]) {
        event.preventDefault();
        run(filtered[active]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, active, close, run]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[15vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-fun-gray bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to… (projects, hire, experience)"
          className="w-full border-0 border-b border-fun-gray bg-transparent px-4 py-3 text-white outline-none focus:ring-0"
        />
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-fun-gray">No matches</li>
          )}
          {filtered.map((cmd, index) => (
            <li key={cmd.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => run(cmd)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                  index === active
                    ? "bg-fun-pink-dark text-white"
                    : "text-fun-gray hover:bg-white/5"
                }`}
              >
                <span className="font-medium text-white">{cmd.label}</span>
                {cmd.hint && <span className="text-xs opacity-70">{cmd.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-fun-gray px-4 py-2 text-xs text-fun-gray">
          ↑↓ navigate · Enter open · Esc close · ⌘K toggle
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
