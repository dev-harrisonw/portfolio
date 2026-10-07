import { useEffect, useState } from "react";

export default function AuthFormStatus() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-sm text-center text-fun-gray-light text-sm leading-relaxed">
      {slow ? (
        <p>
          The sign-in form couldn&apos;t load. Check your connection and refresh.
          If it keeps happening, get in touch.
        </p>
      ) : (
        <p>Loading sign in…</p>
      )}
    </div>
  );
}
