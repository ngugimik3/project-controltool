import { CHECK_LABELS, TEST_KINDS } from "./defaults";
import { STAGES, TASK_STATUS } from "./constants";
import type { ProjectView, TaskView } from "./types";

export const CLOSED_STAGE = STAGES.length - 1;

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", { timeZone: "UTC" });
}

export function isTestKind(kind: string): boolean {
  return (TEST_KINDS as readonly string[]).includes(kind);
}

export function isStepKind(kind: string): boolean {
  return kind === "install" || kind === "commis";
}

export function isCheckOk(item: { kind: string; result: string; status: number }): boolean {
  if (isStepKind(item.kind)) return item.status === 3;
  return item.result === "Pass" || (item.result === "NA" && !isTestKind(item.kind));
}

export function isReceived(status: number): boolean {
  return status >= 7;
}

export function isTaskOverdue(task: TaskView, today = todayISO()): boolean {
  return task.status !== 3 && task.endDate < today;
}

export function isPoSlipping(
  po: { status: number; promisedBy: string; needBy: string },
): boolean {
  return !isReceived(po.status) && po.promisedBy > po.needBy;
}

export function finance(p: Pick<ProjectView, "costLines" | "purchaseOrders">) {
  const budget = p.costLines.reduce((sum, line) => sum + line.budget, 0);
  const actual = p.costLines.reduce((sum, line) => sum + line.actual, 0);
  const committed = p.purchaseOrders
    .filter((po) => po.status > 0)
    .reduce((sum, po) => sum + po.cost, 0);
  return { budget, actual, committed, forecast: Math.max(budget, actual, committed) };
}

export function stageFraction(p: ProjectView): number {
  const ratio = (a: number, b: number) => (b ? a / b : 0);
  if (p.stage === 0) {
    const specDone = p.specDim && p.specVolt && p.specKw ? 1 : 0;
    const approve = p.tasks.find((t) => t.name.toLowerCase().startsWith("approve"));
    return (specDone + (approve && approve.status === 3 ? 1 : 0)) / 2;
  }
  if (p.stage === 2) {
    return ratio(p.purchaseOrders.filter((po) => isReceived(po.status)).length, p.purchaseOrders.length);
  }
  if (p.stage === 8) {
    return ratio(p.docs.filter((d) => d.ready).length, p.docs.length);
  }
  if (p.stage >= CLOSED_STAGE) return 0;
  const kind = ["", "survey", "", "fat", "install", "commis", "sat", "training"][p.stage];
  const checks = p.checkItems.filter((c) => c.kind === kind);
  const numerator = checks.filter(isCheckOk).length + (p.stage === 6 && p.signedBy ? 1 : 0);
  const denominator = checks.length + (p.stage === 6 ? 1 : 0);
  return ratio(numerator, denominator);
}

export function progress(p: ProjectView): number {
  if (p.stage >= CLOSED_STAGE) return 100;
  return Math.round(((p.stage + stageFraction(p)) / CLOSED_STAGE) * 100);
}

export function averageProgress(projects: ProjectView[]): number {
  const active = projects.filter((p) => p.stage < CLOSED_STAGE);
  if (!active.length) return 0;
  return Math.round(active.reduce((sum, p) => sum + progress(p), 0) / active.length);
}

export function projectAlerts(p: ProjectView, today = todayISO()): string[] {
  const alerts: string[] = [];
  for (const task of p.tasks) {
    if (isTaskOverdue(task, today)) {
      alerts.push(`Overdue: ${task.name}. Notify ${task.role}.`);
    }
  }
  for (const po of p.purchaseOrders) {
    if (isPoSlipping(po)) {
      alerts.push(
        `Slipping: ${po.item} from ${po.supplier} is promised ${po.promisedBy}, needed ${po.needBy}.`,
      );
    }
  }
  return alerts;
}

export function blockers(p: ProjectView): string[] {
  const result: string[] = [];
  const stage = STAGES[p.stage];
  const count = (kind: string) =>
    p.checkItems.filter((c) => c.kind === kind && !isCheckOk(c)).length;
  const add = (kind: string, label: string) => {
    const n = count(kind);
    if (n) result.push(`${n} ${label} not done.`);
  };

  if (stage === "Inception") {
    if (!p.specDim || !p.specVolt || !p.specKw) {
      result.push("Complete dimensions, voltage and power in the technical spec.");
    }
    const approve = p.tasks.find((t) => t.name.toLowerCase().startsWith("approve"));
    if (approve && approve.status !== 3) result.push(`Mark “${approve.name}” as Done.`);
  }
  if (stage === "Site Survey") {
    if (!p.visits.some((v) => v.status === "Done")) {
      result.push("Log at least one completed previsit or site survey visit.");
    }
    add("survey", "site survey item(s)");
  }
  if (stage === "Procurement") {
    if (!p.purchaseOrders.length) result.push("No purchase orders raised.");
    const pending = p.purchaseOrders.filter((po) => !isReceived(po.status)).length;
    if (pending) result.push(`${pending} purchase order(s) not yet received.`);
  }
  if (stage === "Workshop & FAT") add("fat", "FAT item(s)");
  if (stage === "Installation") add("install", "installation step(s)");
  if (stage === "Commissioning") add("commis", "commissioning step(s)");
  if (stage === "SAT") {
    add("sat", "SAT item(s)");
    if (!p.signedBy) result.push("Client SAT sign-off is missing.");
  }
  if (stage === "Training") add("training", "training item(s)");
  if (stage === "Handover") {
    const pending = p.docs.filter((d) => !d.ready).length;
    if (pending) result.push(`${pending} handover document(s) not ready.`);
  }
  return result;
}

export function checkLabel(kind: string): string {
  return CHECK_LABELS[kind] ?? kind;
}

export function taskStatusLabel(status: number): string {
  return TASK_STATUS[status] ?? TASK_STATUS[0];
}

export function nextTaskStatus(current: number): number {
  return (current + 1) % 4;
}

export function noteText(p: Pick<ProjectView, "notes">, key: string): string {
  return p.notes.find((n) => n.key === key)?.text ?? "";
}

export function stageLabel(stage: number): string {
  return STAGES[stage] ?? STAGES[0];
}

export function isSatSigned(p: Pick<ProjectView, "signedBy">): boolean {
  return Boolean(p.signedBy);
}

export type GanttUnit = "day" | "week" | "month";

export interface GanttWindow {
  start: number;
  end: number;
  unit: GanttUnit;
}

const DAY = 86_400_000;

function utcDate(iso: string): number {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

export function ganttWindow(project: ProjectView): GanttWindow {
  const gantt = (project.extra.gantt ?? {}) as { from?: string; to?: string; unit?: string };
  const unit: GanttUnit =
    gantt.unit === "day" || gantt.unit === "month" ? gantt.unit : "week";
  const starts = project.tasks.map((task) => utcDate(task.startDate));
  const ends = project.tasks.map((task) => utcDate(task.endDate) + DAY);
  const today = utcDate(todayISO());

  let start = gantt.from ? utcDate(gantt.from) : starts.length ? Math.min(...starts) : today;
  let end = gantt.to ? utcDate(gantt.to) + DAY : ends.length ? Math.max(...ends) : today + DAY;
  if (!Number.isFinite(start)) start = today;
  if (!Number.isFinite(end) || end <= start) end = start + DAY;
  return { start, end, unit };
}

export function ganttTicks(
  window: GanttWindow,
): { x: number; label: string }[] {
  const { start, end, unit } = window;
  const span = end - start;
  const ticks: { x: number; label: string }[] = [];
  if (unit === "month") {
    let cursor = start;
    ticks.push({
      x: 0,
      label: new Date(cursor).toLocaleString("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
    });
    const date = new Date(cursor);
    cursor = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
    while (cursor < end) {
      ticks.push({
        x: (cursor - start) / span,
        label: new Date(cursor).toLocaleString("en-GB", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        }),
      });
      const next = new Date(cursor);
      cursor = Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 1);
    }
    return ticks;
  }

  const step = unit === "day" ? DAY : 7 * DAY;
  const count = Math.ceil(span / step);
  const skip = unit === "day" && count > 45 ? Math.ceil(count / 45) : 1;
  for (let index = 0; index < count; index += skip) {
    const cursor = start + index * step;
    ticks.push({
      x: (cursor - start) / span,
      label: new Date(cursor).toISOString().slice(5, 10),
    });
  }
  return ticks;
}

export function ganttDates(window: GanttWindow) {
  return {
    from: new Date(window.start).toISOString().slice(0, 10),
    to: new Date(window.end - DAY).toISOString().slice(0, 10),
  };
}

export function sortedTasks(tasks: ProjectView["tasks"]) {
  return [...tasks].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.sortOrder - b.sortOrder,
  );
}

export function dependencyTree(
  tasks: Pick<ProjectView["tasks"][number], "id" | "dependsOnId">[],
  taskId: string,
): Set<string> {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const seen = new Set<string>();
  const walk = (id: string | null) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    walk(byId.get(id)?.dependsOnId ?? null);
  };
  walk(taskId);
  return seen;
}

export function canDependOn(
  tasks: Pick<ProjectView["tasks"][number], "id" | "dependsOnId">[],
  taskId: string,
  candidateId: string,
): boolean {
  if (taskId === candidateId) return false;
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let cursor = byId.get(candidateId)?.dependsOnId ?? null;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === taskId) return false;
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = byId.get(cursor)?.dependsOnId ?? null;
  }
  return true;
}

export function taskOverdue(task: ProjectView["tasks"][number], today = todayISO()): boolean {
  return task.status !== 3 && task.endDate < today;
}
