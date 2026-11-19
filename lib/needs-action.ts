import { STAGE_TAB, STAGES, type TabKey } from "./constants";
import { blockers, isPoSlipping, isTaskOverdue, todayISO } from "./planner";
import type { ProjectView } from "./types";

export type ActionSeverity = "critical" | "warning" | "info";

export interface NeedsActionItem {
  id: string;
  projectId: string;
  projectName: string;
  label: string;
  href: TabKey;
  severity: ActionSeverity;
}

export function buildNeedsAction(
  projects: ProjectView[],
  today = todayISO(),
  limit = 12,
): NeedsActionItem[] {
  const items: NeedsActionItem[] = [];

  for (const project of projects) {
    for (const task of project.tasks) {
      if (!isTaskOverdue(task, today)) continue;
      items.push({
        id: `task-${task.id}`,
        projectId: project.id,
        projectName: project.name,
        label: `Overdue: ${task.name}`,
        href: "schedule",
        severity: "critical",
      });
    }

    for (const po of project.purchaseOrders) {
      if (!isPoSlipping(po)) continue;
      items.push({
        id: `po-${po.id}`,
        projectId: project.id,
        projectName: project.name,
        label: `Slipping PO: ${po.item}`,
        href: "procurement",
        severity: "warning",
      });
    }

    const stageName = STAGES[project.stage] ?? "Inception";
    const href = STAGE_TAB[stageName] ?? "dashboard";
    for (const [index, blocker] of blockers(project).entries()) {
      items.push({
        id: `block-${project.id}-${index}`,
        projectId: project.id,
        projectName: project.name,
        label: blocker,
        href,
        severity: "info",
      });
    }
  }

  const rank: Record<ActionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return items
    .sort((a, b) => rank[a.severity] - rank[b.severity] || a.projectName.localeCompare(b.projectName))
    .slice(0, limit);
}
