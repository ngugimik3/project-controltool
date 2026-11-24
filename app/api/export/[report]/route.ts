import { requireProjectAccess } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { getProjectById, getSelectedProject } from "@/lib/data";
import { workbookResponse } from "@/lib/excel";
import {
  buildCostingWorkbook,
  buildScheduleWorkbook,
} from "@/lib/export-reports";

function queryValue(url: URL, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value?.trim()) return value.trim();
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { report } = await params;
  const url = new URL(request.url);
  const projectId = queryValue(url, "project", "projectId");

  if (projectId) await requireProjectAccess(projectId);

  const project = projectId
    ? await getProjectById(projectId)
    : await getSelectedProject();
  if (!project) return new Response("No project selected", { status: 404 });

  if (report === "schedule") {
    const { filename, workbook } = await buildScheduleWorkbook(project);
    return workbookResponse(workbook, filename);
  }

  if (report === "costing") {
    const { filename, workbook } = await buildCostingWorkbook(project);
    return workbookResponse(workbook, filename);
  }

  return new Response("Unknown export", { status: 404 });
}
