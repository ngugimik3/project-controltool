import { notFound } from "next/navigation";
import { requireUser, type SessionUser } from "./auth";
import { prisma } from "./prisma";
import type { Role } from "./roles";

export interface AccessibleProject {
  id: string;
  name: string;
}

async function findProject(projectId: string): Promise<AccessibleProject | null> {
  if (!projectId) return null;
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true },
  });
}

/**
 * Guards server code that receives a projectId. Every active user may access every
 * existing project because the schema has no project-membership relation; when a
 * role list is supplied, that role check is enforced on the server as well.
 */
export async function requireProjectAccess(
  projectId: string,
  ...allowed: Role[]
): Promise<{ user: SessionUser; project: AccessibleProject }> {
  const user = await requireUser(...allowed);
  const project = await findProject(projectId);
  if (!project) notFound();
  return { user, project };
}

/** Lightweight existence check for callers that already have the user. */
export async function projectExists(projectId: string): Promise<AccessibleProject | null> {
  return findProject(projectId);
}
