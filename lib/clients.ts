export type PortalStatus = "none" | "invited" | "active";

export function portalStatus(users: { clerkUserId: string | null }[]): PortalStatus {
  if (users.some((u) => u.clerkUserId)) return "active";
  if (users.length > 0) return "invited";
  return "none";
}

export const portalStatusLabel: Record<PortalStatus, string> = {
  none: "No portal",
  invited: "Invited",
  active: "Signed in",
};

export const portalStatusTone: Record<PortalStatus, string> = {
  none: "bg-red-500/10 text-red-300",
  invited: "bg-yellow-500/15 text-yellow-300",
  active: "bg-fun-pink-dark text-fun-pink-light",
};

export function invoiceStatusTone(status: string) {
  return (
    {
      DRAFT: "bg-fun-gray-darker text-fun-gray-light",
      SENT: "bg-yellow-500/15 text-yellow-300",
      PAID: "bg-fun-pink-dark text-fun-pink-light",
      VOID: "bg-red-500/10 text-red-300",
    }[status] ?? "bg-fun-gray-darker text-fun-gray-light"
  );
}

export function relativeDay(iso: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function dueLabel(dueAt: string | null, status: string) {
  if (!dueAt || status === "PAID" || status === "VOID") return null;
  const due = new Date(dueAt);
  const overdue = status === "SENT" && due.getTime() < Date.now();
  const text = due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return { text: overdue ? `Overdue · due ${text}` : `Due ${text}`, overdue };
}
