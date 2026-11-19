import { prisma } from "./prisma";
import { normalizeRole } from "./roles";
import type { ProfileView } from "./types";

export async function getProfile(userId: string): Promise<ProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      phone: true,
      jobTitle: true,
      department: true,
      bio: true,
      avatarUrl: true,
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username ?? "",
    email: user.email,
    role: normalizeRole(user.role),
    phone: user.phone ?? "",
    jobTitle: user.jobTitle ?? "",
    department: user.department ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? null,
  };
}
