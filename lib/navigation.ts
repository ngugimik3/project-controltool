import {
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderKanban,
  LayoutDashboard,
  PackageCheck,
  Rocket,
  Settings,
  ShoppingCart,
  StickyNote,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./roles";

export type NavScope = "global" | "project" | "admin";

export interface NavItem {
  id: string;
  label: string;
  scope: NavScope;
  group: string;
  icon: LucideIcon;
  /** Absolute URL for global and admin items. */
  href?: string;
  /** Project-relative segment. Empty string is the project overview. */
  segment?: string;
  /** Only highlight on an exact path match. */
  exact?: boolean;
  /** When set, only these roles see and can use the item. */
  roles?: Role[];
}

/**
 * Every navigation item lives in this one array. Reorder a line to reorder the
 * sidebar; the sidebar derives groups and modes from `scope` and `group`.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", scope: "global", group: "Main", href: "/dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", scope: "global", group: "Main", href: "/projects", icon: FolderKanban },
  { id: "reports", label: "Reports", scope: "global", group: "Main", href: "/reports", icon: FileBarChart },

  { id: "users", label: "Users", scope: "admin", group: "Admin", href: "/users", icon: Users, roles: ["superadmin"] },
  { id: "settings", label: "Settings", scope: "admin", group: "Admin", href: "/settings", icon: Settings, roles: ["admin", "superadmin"] },

  { id: "overview", label: "Overview", scope: "project", group: "Overview", segment: "", icon: LayoutDashboard, exact: true },
  { id: "survey", label: "Survey", scope: "project", group: "Plan", segment: "survey", icon: ClipboardList },
  { id: "schedule", label: "Schedule", scope: "project", group: "Plan", segment: "schedule", icon: CalendarDays },
  { id: "procurement", label: "Procurement", scope: "project", group: "Procure", segment: "procurement", icon: ShoppingCart },
  { id: "notes", label: "Notes", scope: "project", group: "Procure", segment: "notes", icon: StickyNote },
  { id: "execution", label: "Execution", scope: "project", group: "Deliver", segment: "execution", icon: Rocket },
  { id: "handover", label: "Handover", scope: "project", group: "Close out", segment: "handover", icon: PackageCheck },
  { id: "documents", label: "Documents", scope: "project", group: "Close out", segment: "documents", icon: FileText },
  { id: "costing", label: "Costing", scope: "project", group: "Close out", segment: "costing", icon: Wallet },
];

export function navHref(item: NavItem, projectId?: string | null): string {
  if (item.href) return item.href;
  if (!projectId) return "/projects";
  return item.segment ? `/projects/${projectId}/${item.segment}` : `/projects/${projectId}`;
}

export function canSeeNavItem(item: NavItem, role: Role): boolean {
  return !item.roles || item.roles.includes(role);
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  projectId?: string | null,
): boolean {
  const href = navHref(item, projectId);
  if (item.exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function projectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

export function navGroups(
  scope: NavScope,
  role: Role,
): { label: string; items: NavItem[] }[] {
  const groups: { label: string; items: NavItem[] }[] = [];
  for (const item of NAV_ITEMS) {
    if (item.scope !== scope || !canSeeNavItem(item, role)) continue;
    const group = groups.find((entry) => entry.label === item.group);
    if (group) group.items.push(item);
    else groups.push({ label: item.group, items: [item] });
  }
  return groups;
}
