import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export const inputClass =
  "dd-input w-full px-3 py-2.5 sm:py-1.5 text-base sm:text-sm outline-none disabled:opacity-50 min-h-[44px] sm:min-h-0";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-fun-gray-light mb-1">{label}</span>
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
    ghost: "border border-[color:var(--dd-border-strong)] text-fun-gray-light hover:bg-[color:var(--dd-raised)] hover:text-white",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-3.5 py-2.5 sm:py-1.5 text-sm font-semibold transition-colors disabled:opacity-40 min-h-[44px] sm:min-h-0 touch-manipulation ${styles} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`dd-panel p-3.5 sm:p-5 ${className}`}>{children}</div>;
}

/** Pounds string ⇄ pence integer for money inputs. */
export const toMinor = (value: string) => (value.trim() === "" ? null : Math.round(parseFloat(value) * 100));
export const fromMinor = (value: number | null | undefined) => (value == null ? "" : (value / 100).toFixed(2));
export const toInt = (value: string) => (value.trim() === "" ? null : parseInt(value, 10));
