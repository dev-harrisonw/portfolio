import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

const PARTY_MS = 8000;
const FADE_MS = 900;
const CONFETTI_COLORS = ["#3BB143", "#ff5a7a", "#ffe066", "#7ae7ff", "#ffffff"];

type PartyPhase = "off" | "on" | "leaving";

function Confetti({ leaving }: { leaving: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 13 + 4) % 97}%`,
        delay: `${(i % 10) * 0.09}s`,
        duration: `${2.2 + (i % 7) * 0.22}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 5) * 3,
        rotate: (i * 41) % 360,
        round: i % 3 === 0,
      })),
    []
  );

  return (
    <div className={`party-confetti${leaving ? " is-leaving" : ""}`} aria-hidden>
      {bits.map((bit, i) => (
        <i
          key={i}
          style={{
            left: bit.left,
            width: bit.size,
            height: bit.size,
            background: bit.color,
            borderRadius: bit.round ? "50%" : "1px",
            animationDelay: bit.delay,
            animationDuration: bit.duration,
            transform: `rotate(${bit.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function DontPress() {
  const [phase, setPhase] = useState<PartyPhase>("off");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.remove("party-mode", "party-leaving");
    try {
      localStorage.removeItem("party-mode");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("party-mode", phase === "on");
    html.classList.toggle("party-leaving", phase === "leaving");
    if (phase === "off") {
      html.classList.remove("party-mode", "party-leaving");
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "on") return undefined;
    const timer = window.setTimeout(() => setPhase("leaving"), PARTY_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return undefined;
    const timer = window.setTimeout(() => setPhase("off"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const active = phase === "on";
  const showEffects = phase === "on" || phase === "leaving";

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        aria-label={active ? "Okay, stop the party" : "Do not press"}
        onClick={() => setPhase((current) => (current === "on" ? "leaving" : "on"))}
        className={`sqD dont-press left-[-24px] top-[-56px] w-[120px] sm:left-[-175px] sm:top-[0px] sm:w-[240px] lg:left-[-200px] lg:top-[4px] lg:w-[260px] ${
          active ? "dont-press-on" : ""
        }`}
        style={{ animationDelay: "0.85s" }}
      >
        <svg viewBox="40 6 272 160" fill="none" aria-hidden="true">
          <g
            transform="rotate(-7 176 84)"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M56 84c6-52 70-68 120-62 58 6 114 24 120 62 6 40-58 62-122 64-68 2-122-26-118-64z"
              strokeWidth="6"
            />
            <g transform="translate(176 84) scale(0.8) translate(-176 -84)">
              <path
                d="M76 44v34m0-34c22-2 34 8 34 17 0 10-12 19-34 17"
                strokeWidth="4.5"
              />
              <path d="M122 61c2-16 26-16 28 0 2 16-26 18-28 0z" strokeWidth="4.5" />
              <path d="M164 78V44l28 34V46" strokeWidth="4.5" />
              <path d="M206 61c1-16 26-16 28 1 1 16-26 18-28-1z" strokeWidth="4.5" />
              <path d="M246 44h30m-15 0v34" strokeWidth="4.5" />
              <path
                d="M78 90v34m0-34c22-2 30 8 28 17-2 9-12 13-28 12"
                strokeWidth="4.5"
              />
              <path
                d="M122 124V90m0 0c18-1 28 8 26 16-1 7-10 12-22 12l24 8"
                strokeWidth="4.5"
              />
              <path d="M168 90v34m0-34h24m-24 17h20m-20 17h26" strokeWidth="4.5" />
              <path
                d="M210 96c10-9 32-7 28 9-3 11-21 9-23 17-2 9 16 14 28 4"
                strokeWidth="4.5"
              />
              <path
                d="M250 96c11-9 32-5 28 9-3 11-21 9-23 17-2 9 18 14 30 3"
                strokeWidth="4.5"
              />
            </g>
          </g>
        </svg>
      </button>
      {showEffects &&
        mounted &&
        createPortal(<Confetti leaving={phase === "leaving"} />, document.body)}
    </>
  );
}

export default DontPress;
