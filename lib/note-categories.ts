export const ENGINEER_CATEGORIES = [
  "GENERAL",
  "SITE",
  "DESIGN",
  "MEETING",
  "DECISION",
  "ISSUE",
] as const;

export const MODULE_CATEGORIES = [
  "PROCUREMENT",
  "SUPPLIER",
  "QUOTATION",
  "DELIVERY",
  "APPROVAL",
] as const;

export const CATEGORIES = [
  ...ENGINEER_CATEGORIES,
  ...MODULE_CATEGORIES,
] as const;

export type NoteCategoryValue = (typeof CATEGORIES)[number];
export type NoteScope = "all" | "engineer" | "modules";

export const CATEGORY_LABELS: Record<NoteCategoryValue, string> = {
  GENERAL: "General",
  SITE: "Site",
  DESIGN: "Design",
  MEETING: "Meeting",
  DECISION: "Decision",
  ISSUE: "Issue",
  PROCUREMENT: "Procurement",
  SUPPLIER: "Supplier",
  QUOTATION: "Quotation",
  DELIVERY: "Delivery",
  APPROVAL: "Approval",
};

export function labelFor(category: string) {
  return CATEGORY_LABELS[category as NoteCategoryValue] ?? category;
}

export function categoriesForScope(scope: NoteScope): readonly NoteCategoryValue[] {
  if (scope === "engineer") return ENGINEER_CATEGORIES;
  if (scope === "modules") return MODULE_CATEGORIES;
  return CATEGORIES;
}

export function scopeForCategory(category: NoteCategoryValue): Exclude<NoteScope, "all"> {
  return (MODULE_CATEGORIES as readonly string[]).includes(category)
    ? "modules"
    : "engineer";
}
