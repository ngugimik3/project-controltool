export const TABS = [
  "dashboard",
  "projects",
  "survey",
  "schedule",
  "procurement",
  "fat",
  "install",
  "commis",
  "sat",
  "training",
  "support",
  "handover",
  "costing",
  "admin",
] as const;

export type TabKey = (typeof TABS)[number];

export const TL: Record<TabKey, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  survey: "Site Survey",
  schedule: "Schedule",
  procurement: "Procurement",
  fat: "FAT",
  install: "Installation",
  commis: "Commissioning",
  sat: "SAT",
  training: "Training",
  support: "Support",
  handover: "Handover",
  costing: "Costing",
  admin: "Admin",
};

export const STAGES = [
  "Inception",
  "Site Survey",
  "Procurement",
  "Workshop & FAT",
  "Installation",
  "Commissioning",
  "SAT",
  "Training",
  "Handover",
  "Closed",
] as const;

export const TASK_STATUS = ["Not started", "In progress", "Blocked", "Done"] as const;

export const PO_STATUS = [
  "Draft",
  "Approved",
  "Sent",
  "Confirmed",
  "In production",
  "Shipped",
  "In transit",
  "Received",
  "Inspected",
] as const;

export const DEFAULT_PROJECT_TYPES = ["Control panel", "Pump station", "Fountain system"];
