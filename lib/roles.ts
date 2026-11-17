export type Role = "superadmin" | "admin" | "user";

export const ROLES: Role[] = ["superadmin", "admin", "user"];

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export function normalizeRole(value: unknown): Role {
  return value === "superadmin" || value === "admin" ? value : "user";
}

/** Same idea as the legacy can('admin','superadmin'). */
export function can(role: Role, ...allowed: Role[]): boolean {
  return allowed.includes(role);
}
