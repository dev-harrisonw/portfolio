export const EXPENSE_CATEGORIES = ["SOFTWARE", "HOSTING", "CONTRACTOR", "TRAVEL", "OFFICE", "OTHER"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
  SOFTWARE: "Software",
  HOSTING: "Hosting",
  CONTRACTOR: "Contractor",
  TRAVEL: "Travel",
  OFFICE: "Office",
  OTHER: "Other",
};
