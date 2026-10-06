export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusLabel: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  WON: "Won",
  LOST: "Lost",
};

export const leadStatusTone: Record<LeadStatus, string> = {
  NEW: "bg-fun-pink-dark text-fun-pink-light",
  CONTACTED: "bg-yellow-500/15 text-yellow-300",
  QUALIFIED: "bg-sky-500/15 text-sky-300",
  WON: "bg-fun-pink-dark text-fun-pink-light",
  LOST: "bg-fun-gray-darker text-fun-gray-light",
};
