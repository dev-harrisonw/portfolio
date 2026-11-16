import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/fetcher";

export default function InvoiceName({
  id,
  number,
  href,
  onSaved,
  onError,
}: {
  id: string;
  number: string;
  href?: string;
  onSaved?: (number: string) => void;
  onError?: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(number);
  const skip = useRef(false);

  useEffect(() => setValue(number), [number]);

  const save = async () => {
    const next = value.trim();
    if (!next || next === number) {
      setValue(number);
      setEditing(false);
      return;
    }
    try {
      await api(`/api/admin/invoices/${id}`, { method: "PATCH", body: { number: next } });
      setEditing(false);
      onSaved?.(next);
    } catch (e) {
      onError?.((e as Error).message);
      setValue(number);
      setEditing(false);
    }
  };

  const label = href ? (
    <Link href={href} className="truncate hover:text-fun-pink">
      {number}
    </Link>
  ) : (
    <span className="truncate">{number}</span>
  );

  return (
    <span className="group relative inline-flex min-w-0 max-w-full items-center align-baseline pr-6">
      {editing ? (
        <input
          autoFocus
          value={value}
          size={Math.max(value.length, 4)}
          aria-label="Invoice name"
          onChange={(event) => setValue(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={() => {
            if (skip.current) {
              skip.current = false;
              return;
            }
            void save();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            }
            if (event.key === "Escape") {
              skip.current = true;
              setValue(number);
              setEditing(false);
            }
          }}
          className="w-auto max-w-full border-0 border-b border-fun-pink bg-transparent px-0 py-0 font-bold text-inherit outline-none"
        />
      ) : (
        label
      )}
      {!editing && (
        <button
          type="button"
          aria-label={`Rename ${number}`}
          onClick={() => setEditing(true)}
          className="absolute right-0 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 max-sm:opacity-80"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
          </svg>
        </button>
      )}
    </span>
  );
}
