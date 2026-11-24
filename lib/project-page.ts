import { notFound } from "next/navigation";
import { requireProjectAccess } from "./access";
import { getProjectById } from "./data";
import type { ProjectView } from "./types";
import type { SessionUser } from "./auth";

export async function projectPageData(
  params: Promise<{ projectId: string }>,
): Promise<{ user: SessionUser; project: ProjectView; projectId: string }> {
  const { projectId } = await params;
  const { user } = await requireProjectAccess(projectId);
  const project = await getProjectById(projectId);
  if (!project) notFound();
  return { user, project, projectId };
}
