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

function alignWeekStart(ms: number): number {
  const d = new Date(ms);
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const back = day === 0 ? 6 : day - 1; // Monday-based weeks
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back);
}

function alignWeekEnd(ms: number): number {
  const start = alignWeekStart(ms);
  return start + 7 * DAY;
}

/** Pad the gantt window so edge bars are not clipped. */
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

  // Pad so bars are not clipped at the edges
  if (!gantt.from || !gantt.to) {
    if (unit === "month") {
      const s = new Date(start);
      start = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1);
      const e = new Date(end - DAY);
      end = Date.UTC(e.getUTCFullYear(), e.getUTCMonth() + 1, 1);
    } else if (unit === "week") {
      start = alignWeekStart(start - 7 * DAY);
      end = alignWeekEnd(end + 7 * DAY - 1);
    } else {
      start -= 2 * DAY;
      end += 2 * DAY;
    }
  } else if (unit === "week") {
    start = alignWeekStart(start);
    end = alignWeekEnd(Math.max(end, start + DAY));
  }

  if (end <= start) end = start + (unit === "month" ? 31 * DAY : 7 * DAY);
  return { start, end, unit };
}

const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export type GanttDayColumn = {
  start: number;
  end: number;
  iso: string;
  day: number;
  weekday: string;
  monthKey: string;
  monthLabel: string;
  x: number;
  width: number;
  isToday: boolean;
  isWeekend: boolean;
};

export type GanttMonthBand = {
  key: string;
  label: string;
  count: number;
  x: number;
  width: number;
};

/** One column per calendar day in the window — never skips dates. */
export function ganttDayColumns(
  window: GanttWindow,
  today = todayISO(),
): GanttDayColumn[] {
  const span = window.end - window.start;
  if (span <= 0) return [];
  const columns: GanttDayColumn[] = [];
  let cursor = window.start;
  while (cursor < window.end) {
    const next = cursor + DAY;
    const date = new Date(cursor);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getUTCDay();
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    columns.push({
      start: cursor,
      end: next,
      iso,
      day: date.getUTCDate(),
      weekday: WEEKDAY_SHORT[dow],
      monthKey,
      monthLabel: date.toLocaleString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      x: ((cursor - window.start) / span) * 100,
      width: (DAY / span) * 100,
      isToday: iso === today,
      isWeekend: dow === 0 || dow === 6,
    });
    cursor = next;
  }
  return columns;
}

/** Month bands that span consecutive day columns (for the axis header). */
export function ganttMonthBands(days: GanttDayColumn[]): GanttMonthBand[] {
  if (!days.length) return [];
  const bands: GanttMonthBand[] = [];
  for (const day of days) {
    const last = bands[bands.length - 1];
    if (last && last.key === day.monthKey) {
      last.count += 1;
      last.width += day.width;
      continue;
    }
    bands.push({
      key: day.monthKey,
      label: day.monthLabel,
      count: 1,
      x: day.x,
      width: day.width,
    });
  }
  return bands;
}

/** Tick marks for every day (no skipping). */
export function ganttTicks(
  window: GanttWindow,
): { x: number; label: string; iso: string }[] {
  return ganttDayColumns(window).map((day) => ({
    x: day.x / 100,
    label: `${day.day} ${day.weekday}`,
    iso: day.iso,
  }));
}

/** Whether a task covers a given ISO calendar day. */
export function dayCovered(
  dayIso: string,
  startDate: string,
  endDate: string,
): boolean {
  return dayIso >= startDate && dayIso <= endDate;
}

export function ganttDates(window: GanttWindow) {
  return {
    from: new Date(window.start).toISOString().slice(0, 10),
    to: new Date(window.end - DAY).toISOString().slice(0, 10),
  };
}

/** Fraction 0–1 of “today” within the gantt window, or null if outside. */
export function ganttTodayX(window: GanttWindow, today = todayISO()): number | null {
  const t = utcDate(today) + DAY / 2;
  if (t < window.start || t > window.end) return null;
  const span = window.end - window.start;
  if (span <= 0) return null;
  return (t - window.start) / span;
}

export function ganttBar(
  window: GanttWindow,
  startDate: string,
  endDate: string,
): { left: number; width: number } {
  const span = window.end - window.start;
  if (span <= 0) return { left: 0, width: 0 };
  const leftMs = Math.max(utcDate(startDate), window.start);
  const rightMs = Math.min(utcDate(endDate) + DAY, window.end);
  if (rightMs <= leftMs) return { left: 0, width: 0 };
  return {
    left: ((leftMs - window.start) / span) * 100,
    width: ((rightMs - leftMs) / span) * 100,
  };
}

/** Inclusive calendar-day span for a task. */
export function taskDays(startDate: string, endDate: string): number {
  const start = utcDate(startDate);
  const end = utcDate(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
  return Math.floor((end - start) / DAY) + 1;
}

/**
 * Display status derived from stored status + dates.
 * 0 Not started · 1 In progress · 2 Blocked/Overdue · 3 Done
 */
export function derivedTaskStatus(
  task: Pick<TaskView, "status" | "startDate" | "endDate">,
  today = todayISO(),
): number {
  if (task.status === 3) return 3;
  if (task.status === 2) return 2;
  if (today < task.startDate) return 0;
  if (today > task.endDate) return 2; // overdue → attention
  return 1;
}

export const STATUS_SYMBOLS = ["○", "▶", "!", "✓"] as const;

export function statusSymbol(status: number): string {
  return STATUS_SYMBOLS[status] ?? STATUS_SYMBOLS[0];
}

/** Progress % from dates (Done = 100, Not started = 0). */
export function taskPercent(
  task: Pick<TaskView, "status" | "startDate" | "endDate">,
  today = todayISO(),
): number {
  if (task.status === 3) return 100;
  const days = taskDays(task.startDate, task.endDate);
  if (days <= 0) return 0;
  if (today < task.startDate) return 0;
  if (today > task.endDate) return task.status === 3 ? 100 : 99;
  const elapsed = taskDays(task.startDate, today);
  return Math.max(1, Math.min(99, Math.round((elapsed / days) * 100)));
}

const STAGE_MATCHERS: { stage: number; patterns: RegExp[] }[] = [
  { stage: 0, patterns: [/inception/i, /spec/i, /approv/i, /design/i] },
  { stage: 1, patterns: [/survey/i, /previsit/i, /site visit/i] },
  { stage: 2, patterns: [/procur/i, /purchase/i, /\bpo\b/i, /order/i] },
  { stage: 3, patterns: [/workshop/i, /\bfat\b/i, /factory/i, /assembl/i] },
  { stage: 4, patterns: [/install/i] },
  { stage: 5, patterns: [/commiss/i] },
  { stage: 6, patterns: [/\bsat\b/i, /acceptance/i] },
  { stage: 7, patterns: [/train/i] },
  { stage: 8, patterns: [/handover/i, /pack/i, /as-?built/i, /document/i] },
];

export function taskStageIndex(task: Pick<TaskView, "name" | "role">): number {
  const hay = `${task.name} ${task.role}`;
  for (const entry of STAGE_MATCHERS) {
    if (entry.patterns.some((re) => re.test(hay))) return entry.stage;
  }
  return 0;
}

export function groupTasksByStage(tasks: TaskView[]): { stage: number; label: string; tasks: TaskView[] }[] {
  const buckets = new Map<number, TaskView[]>();
  for (const task of sortedTasks(tasks)) {
    const stage = taskStageIndex(task);
    const list = buckets.get(stage) ?? [];
    list.push(task);
    buckets.set(stage, list);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([stage, group]) => ({
      stage,
      label: STAGES[stage] ?? `Stage ${stage}`,
      tasks: group,
    }));
}

/** Monday-aligned week columns covering the window. */
export function ganttWeekColumns(
  window: GanttWindow,
): { start: number; end: number; label: string; x: number; width: number }[] {
  const span = window.end - window.start;
  if (span <= 0) return [];
  const columns: { start: number; end: number; label: string; x: number; width: number }[] = [];
  let cursor = alignWeekStart(window.start);
  while (cursor < window.end) {
    const next = cursor + 7 * DAY;
    const left = Math.max(cursor, window.start);
    const right = Math.min(next, window.end);
    if (right > left) {
      const startLabel = new Date(cursor).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      });
      const endMs = Math.min(next - DAY, window.end - DAY);
      const endLabel = new Date(endMs).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      });
      columns.push({
        start: cursor,
        end: next,
        label: startLabel === endLabel ? startLabel : `${startLabel}–${endLabel}`,
        x: ((left - window.start) / span) * 100,
        width: ((right - left) / span) * 100,
      });
    }
    cursor = next;
  }
  return columns;
}

/** Fraction of a week column covered by a task (0–1). */
export function weekCoverage(
  weekStart: number,
  weekEnd: number,
  startDate: string,
  endDate: string,
): number {
  const left = Math.max(weekStart, utcDate(startDate));
  const right = Math.min(weekEnd, utcDate(endDate) + DAY);
  if (right <= left) return 0;
  return (right - left) / (weekEnd - weekStart);
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
