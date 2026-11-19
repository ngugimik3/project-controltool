import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { baseOptions } from "./auth-config";
import { prisma } from "./prisma";
import { normalizeRole, type Role } from "./roles";

export const auth = betterAuth({
  ...baseOptions,
  // nextCookies() must be the last plugin.
  plugins: [username(), nextCookies()],
});

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  avatarUrl: string | null;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      avatarUrl: true,
    },
  });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username ?? "",
    role: normalizeRole(user.role),
    avatarUrl: user.avatarUrl ?? null,
  };
});

/** Redirects to /login when signed out, and to /dashboard when the role is not allowed. */
export async function requireUser(...allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowed.length > 0 && !allowed.includes(user.role)) redirect("/dashboard");
  return user;
}
