import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const inputClass =
  "w-full rounded-lg bg-black/20 border border-fun-gray-darker px-3 py-2 text-sm outline-none focus:border-fun-pink disabled:opacity-50";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-fun-gray-light mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-fun-gray-medium mt-1">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-fun-pink text-white hover:bg-fun-pink-light",
    ghost: "border border-fun-gray-darker text-fun-gray-light hover:border-fun-pink hover:text-white",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-fun-gray-darker bg-fun-gray-darkest/60 p-5 ${className}`}>{children}</div>;
}

/** Pounds string ⇄ pence integer for money inputs. */
export const toMinor = (value: string) => (value.trim() === "" ? null : Math.round(parseFloat(value) * 100));
export const fromMinor = (value: number | null | undefined) => (value == null ? "" : (value / 100).toFixed(2));
export const toInt = (value: string) => (value.trim() === "" ? null : parseInt(value, 10));
