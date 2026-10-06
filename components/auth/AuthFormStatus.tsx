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
          The sign-in form couldn&apos;t load. Clerk&apos;s domain{" "}
          <span className="font-monospace text-white">clerk.harrisonwarburton.com</span> is not
          resolving — add a CNAME to <span className="font-monospace text-white">frontend-api.clerk.services</span>{" "}
          in DNS, then refresh.
        </p>
      ) : (
        <p>Loading sign in…</p>
      )}
    </div>
  );
}
