import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import { routes } from "@/data/global";
import useDelayedRender from "use-delayed-render";
import { MobileProfileCard } from "@/components/auth/AccountButton";

export default function MobileNavbar({ currentPage }: { currentPage?: string }) {
  const router = useRouter();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerH, setHeaderH] = useState(88);
  const { mounted: isMenuMounted, rendered: isMenuRendered } = useDelayedRender(
    isMenuOpen,
    {
      enterDelay: 20,
      exitDelay: 300,
    }
  );

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const update = () => setHeaderH(el.getBoundingClientRect().height);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
    document.body.style.overflow = "";
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      setIsMenuOpen(true);
      document.body.style.overflow = "hidden";
    }
  }

  useEffect(() => {
    const onRoute = () => closeMenu();
    router.events.on("routeChangeStart", onRoute);
    return () => {
      router.events.off("routeChangeStart", onRoute);
      document.body.style.overflow = "";
    };
  }, [router.events]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  return (
    <nav className="relative">
      <div
        ref={headerRef}
        className="sticky top-0 z-[110] w-full flex items-center justify-between px-5 py-4 bg-bg/95 backdrop-blur-md"
      >
        <Link href="/" className="list-none font-bold text-lg" onClick={closeMenu}>
          <img
            className="site-logo"
            src="/static/logos/logo_full.svg"
            width="160"
            alt="Harrison Warburton"
          />
        </Link>
        <button
          className="burger visible md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          type="button"
          onClick={toggleMenu}
        >
          <MenuIcon data-hide={isMenuOpen} />
          <CrossIcon data-hide={!isMenuOpen} />
        </button>
      </div>
      {isMenuMounted && (
        <div
          className={`menu flex flex-col bg-bg ${isMenuRendered ? "menuRendered" : ""}`}
          style={{ top: headerH }}
        >
          <MobileProfileCard onNavigate={closeMenu} />
          <ul className="mt-6 flex flex-col">
            {routes.map((item, index) => {
              const active = currentPage === item.title;
              return (
                <li
                  key={item.path}
                  className="border-b border-gray-900 text-gray-100"
                  style={{ transitionDelay: `${120 + index * 40}ms` }}
                >
                  <Link
                    href={item.path}
                    onClick={closeMenu}
                    className={`flex w-full py-4 text-lg font-semibold ${
                      active ? "text-fun-pink" : "text-white"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
}

function MenuIcon(props) {
  return (
    <svg
      className="h-5 w-5 absolute text-gray-100"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M2.5 7.5H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 12.5H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon(props) {
  return (
    <svg
      className="h-5 w-5 absolute text-gray-100"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}
