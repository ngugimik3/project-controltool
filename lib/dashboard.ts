import { STAGES } from "./constants";
import {
  addDays,
  averageProgress,
  CLOSED_STAGE,
  finance,
  isPoSlipping,
  isTaskOverdue,
  progress,
  todayISO,
} from "./planner";
import type { ActivityRow } from "./data";
import type { ProjectView } from "./types";

const DAY_MS = 86_400_000;

export const RANGE_KEYS = ["7d", "30d", "90d", "12m"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];
export const DEFAULT_RANGE: RangeKey = "30d";

export const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12m": "12 months",
};

export const RANGE_SHORT: Record<RangeKey, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  "12m": "12m",
};

export function parseRange(value: string | string[] | undefined): RangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return (RANGE_KEYS as readonly string[]).includes(raw ?? "")
    ? (raw as RangeKey)
    : DEFAULT_RANGE;
}

/** Stage index of "Handover"; Closed sits after it. */
export const HANDOVER_STAGE = STAGES.indexOf("Handover");

export const STAGE_SHORT = [
  "Inception",
  "Survey",
  "Procure",
  "FAT",
  "Install",
  "Commis.",
  "SAT",
  "Training",
  "Handover",
] as const;

export type Health =
  | "completed"
  | "overdue"
  | "at-risk"
  | "in-progress"
  | "not-started";

export interface HealthStyle {
  label: string;
  color: string;
  badgeClass: string;
}

export const HEALTH: Record<Health, HealthStyle> = {
  completed: {
    label: "Completed",
    color: "var(--chart-green)",
    badgeClass: "bg",
  },
  overdue: { label: "Overdue", color: "var(--chart-red)", badgeClass: "br" },
  "at-risk": {
    label: "At risk",
    color: "var(--chart-amber)",
    badgeClass: "ba",
  },
  "in-progress": {
    label: "In progress",
    color: "var(--chart-brand)",
    badgeClass: "bn",
  },
  "not-started": {
    label: "Not started",
    color: "var(--chart-grey)",
    badgeClass: "bn",
  },
};

export function projectHealth(p: ProjectView, today = todayISO()): Health {
  if (p.stage >= HANDOVER_STAGE) return "completed";
  if (p.tasks.some((task) => isTaskOverdue(task, today))) return "overdue";
  const slipping = p.purchaseOrders.some((po) => isPoSlipping(po));
  const soon = addDays(today, 3);
  const dueSoon = p.tasks.some(
    (task) =>
      task.status !== 3 && task.endDate >= today && task.endDate <= soon,
  );
  if (slipping || dueSoon) return "at-risk";
  const untouched =
    p.stage === 0 &&
    progress(p) === 0 &&
    p.tasks.every((task) => task.status === 0);
  return untouched ? "not-started" : "in-progress";
}

export interface TrendPoint {
  label: string;
  created: number;
  completed: number;
}

export interface StatusSlice {
  key: Health;
  label: string;
  value: number;
  color: string;
  percent: number;
}

export interface StageSlice {
  key: string;
  short: string;
  label: string;
  value: number;
}

export interface DeadlineRow {
  id: string;
  task: string;
  projectId: string;
  project: string;
  due: string;
  dueLabel: string;
  daysLeft: number;
  health: Health;
  healthLabel: string;
  badgeClass: string;
  progress: number;
}

export interface OverdueRow {
  id: string;
  name: string;
  client: string;
  overdueTasks: number;
  slippingPos: number;
  progress: number;
}

export interface DashboardKpis {
  total: number;
  active: number;
  overdue: number;
  atRisk: number;
  handedOver: number;
  closed: number;
  overdueTasks: number;
  slippingPos: number;
  averageProgress: number;
  forecastMargin: number;
  createdInRange: number;
  createdPrevious: number;
}

export interface DashboardSnapshot {
  kpis: DashboardKpis;
  statusSlices: StatusSlice[];
  totalProjects: number;
  pipeline: StageSlice[];
  trend: TrendPoint[];
  deadlines: DeadlineRow[];
  overdueProjects: OverdueRow[];
  activity: ActivityRow[];
}

// Add this helper function to lib/dashboard.ts

export type HealthStatus = "green" | "amber" | "red";

export function calculateProjectHealth(
  overdueTasks: number,
  atRiskTasks: number,
  averageProgress: number,
): HealthStatus {
  if (overdueTasks > 0) return "red";
  if (atRiskTasks > 0 || averageProgress < 30) return "amber";
  return "green";
}

interface Bucket {
  start: string;
  end: string;
  label: string;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function shortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function bucketsFor(range: RangeKey, today: string): Bucket[] {
  const end = parseISO(today);
  if (range === "7d") {
    return Array.from({ length: 7 }, (_, index) => {
      const day = isoDate(new Date(end.getTime() - (6 - index) * DAY_MS));
      return { start: day, end: day, label: shortDate(day) };
    });
  }
  if (range === "30d") {
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(end.getTime() - (29 - index * 5) * DAY_MS);
      const stop = new Date(start.getTime() + 4 * DAY_MS);
      return {
        start: isoDate(start),
        end: isoDate(stop),
        label: shortDate(isoDate(start)),
      };
    });
  }
  if (range === "90d") {
    return Array.from({ length: 13 }, (_, index) => {
      const start = new Date(end.getTime() - (90 - index * 7) * DAY_MS);
      const stop = new Date(start.getTime() + 6 * DAY_MS);
      return {
        start: isoDate(start),
        end: isoDate(stop),
        label: shortDate(isoDate(start)),
      };
    });
  }
  return Array.from({ length: 12 }, (_, index) => {
    const offset = 11 - index;
    const start = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - offset, 1),
    );
    const stop = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
    );
    return {
      start: isoDate(start),
      end: offset === 0 ? today : isoDate(stop),
      label: start.toLocaleDateString("en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
    };
  });
}

function within(iso: string, bucket: Bucket): boolean {
  const day = iso.slice(0, 10);
  return day >= bucket.start && day <= bucket.end;
}

export function buildDashboard({
  projects,
  activity,
  range,
  today = todayISO(),
}: {
  projects: ProjectView[];
  activity: ActivityRow[];
  range: RangeKey;
  today?: string;
}): DashboardSnapshot {
  const healthById = new Map(
    projects.map(
      (project) => [project.id, projectHealth(project, today)] as const,
    ),
  );

  const total = projects.length;
  const handedOver = projects.filter(
    (project) => project.stage >= HANDOVER_STAGE,
  ).length;
  const closed = projects.filter(
    (project) => project.stage >= CLOSED_STAGE,
  ).length;
  const overdue = projects.filter(
    (project) => healthById.get(project.id) === "overdue",
  ).length;
  const atRisk = projects.filter(
    (project) => healthById.get(project.id) === "at-risk",
  ).length;
  const overdueTasks = projects.reduce(
    (sum, project) =>
      sum + project.tasks.filter((task) => isTaskOverdue(task, today)).length,
    0,
  );
  const slippingPos = projects.reduce(
    (sum, project) =>
      sum + project.purchaseOrders.filter((po) => isPoSlipping(po)).length,
    0,
  );
  const forecastMargin = projects.reduce(
    (sum, project) => sum + project.contract - finance(project).forecast,
    0,
  );

  const buckets = bucketsFor(range, today);
  const trend: TrendPoint[] = buckets.map((bucket) => ({
    label: bucket.label,
    created: projects.filter((project) => within(project.createdAt, bucket))
      .length,
    completed: projects.filter(
      (project) =>
        project.stage >= HANDOVER_STAGE && within(project.updatedAt, bucket),
    ).length,
  }));

  const windowStart = buckets[0]?.start ?? today;
  const windowDays =
    Math.round(
      (parseISO(today).getTime() - parseISO(windowStart).getTime()) / DAY_MS,
    ) + 1;
  const previousEnd = isoDate(
    new Date(parseISO(windowStart).getTime() - DAY_MS),
  );
  const previousStart = isoDate(
    new Date(
      parseISO(previousEnd).getTime() - (Math.max(windowDays, 1) - 1) * DAY_MS,
    ),
  );
  const createdInRange = projects.filter((project) => {
    const day = project.createdAt.slice(0, 10);
    return day >= windowStart && day <= today;
  }).length;
  const createdPrevious = projects.filter((project) => {
    const day = project.createdAt.slice(0, 10);
    return day >= previousStart && day <= previousEnd;
  }).length;

  const statusOrder: Health[] = [
    "completed",
    "in-progress",
    "at-risk",
    "overdue",
    "not-started",
  ];
  const statusSlices: StatusSlice[] = statusOrder
    .map((key) => {
      const value = projects.filter(
        (project) => healthById.get(project.id) === key,
      ).length;
      return {
        key,
        label: HEALTH[key].label,
        value,
        color: HEALTH[key].color,
        percent: total ? Math.round((value / total) * 100) : 0,
      };
    })
    .filter((slice) => slice.value > 0);

  const pipeline: StageSlice[] = STAGES.slice(0, HANDOVER_STAGE + 1).map(
    (label, index) => ({
      key: String(index),
      short: STAGE_SHORT[index] ?? label,
      label,
      value: projects.filter((project) => project.stage === index).length,
    }),
  );

  const horizon = addDays(today, 14);
  const deadlines: DeadlineRow[] = projects
    .flatMap((project) =>
      project.tasks
        .filter(
          (task) =>
            task.status !== 3 &&
            task.endDate >= today &&
            task.endDate <= horizon,
        )
        .map((task) => {
          const health = healthById.get(project.id) ?? "in-progress";
          const daysLeft = Math.round(
            (parseISO(task.endDate).getTime() - parseISO(today).getTime()) /
              DAY_MS,
          );
          return {
            id: task.id,
            task: task.name,
            projectId: project.id,
            project: project.name,
            due: task.endDate,
            dueLabel: shortDate(task.endDate),
            daysLeft,
            health,
            healthLabel: HEALTH[health].label,
            badgeClass: HEALTH[health].badgeClass,
            progress: progress(project),
          };
        }),
    )
    .sort(
      (a, b) =>
        a.due.localeCompare(b.due) || a.project.localeCompare(b.project),
    )
    .slice(0, 8);

  const overdueProjects: OverdueRow[] = projects
    .map((project) => ({
      id: project.id,
      name: project.name,
      client: project.client,
      overdueTasks: project.tasks.filter((task) => isTaskOverdue(task, today))
        .length,
      slippingPos: project.purchaseOrders.filter((po) => isPoSlipping(po))
        .length,
      progress: progress(project),
    }))
    .filter((row) => row.overdueTasks > 0 || row.slippingPos > 0)
    .sort(
      (a, b) =>
        b.overdueTasks - a.overdueTasks || b.slippingPos - a.slippingPos,
    )
    .slice(0, 5);

  return {
    kpis: {
      total,
      active: total - handedOver,
      overdue,
      atRisk,
      handedOver,
      closed,
      overdueTasks,
      slippingPos,
      averageProgress: averageProgress(projects),
      forecastMargin,
      createdInRange,
      createdPrevious,
    },
    statusSlices,
    totalProjects: total,
    pipeline,
    trend,
    deadlines,
    overdueProjects,
    activity: activity.slice(0, 10),
  };
}
