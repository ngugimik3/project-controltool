"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/data";
import { saveSetting } from "@/lib/settings";
import { canDependOn, taskStatusLabel } from "@/lib/planner";
import { parseForm, zDate, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

function depId(value: string): string | null {
  return value && value !== "0" ? value : null;
}

async function loadProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      extra: true,
      tasks: {
        select: {
          id: true,
          name: true,
          role: true,
          owner: true,
          startDate: true,
          endDate: true,
          status: true,
          sortOrder: true,
          dependsOnId: true,
        },
      },
    },
  });
}

export async function saveTaskAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      taskId: zShortText.min(1),
      name: z.string().trim().min(1, "Task name is required.").max(300),
      role: z.string().trim().max(120),
      owner: z.string().trim().max(120),
      start: zDate,
      end: zDate,
      dependsOnId: z.string(),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid task." };
  if (parsed.data.end < parsed.data.start) {
    return { error: "The end date cannot be before the start date." };
  }

  const project = await loadProject(parsed.data.projectId);
  const task = project?.tasks.find((item) => item.id === parsed.data!.taskId);
  if (!project || !task) return { error: "That task was not found." };

  const dep = depId(parsed.data.dependsOnId);
  if (dep) {
    if (dep === task.id || !project.tasks.some((item) => item.id === dep)) {
      return { error: "Choose a valid dependency." };
    }
    if (!canDependOn(project.tasks, task.id, dep)) {
      return { error: "That dependency would create a loop." };
    }
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      owner: parsed.data.owner,
      startDate: new Date(`${parsed.data.start}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.end}T00:00:00.000Z`),
      dependsOnId: dep,
    },
  });

  const changes: string[] = [];
  if (task.name !== parsed.data.name) changes.push("name");
  if (task.role !== parsed.data.role) changes.push("role");
  if (task.owner !== parsed.data.owner) changes.push("owner");
  if (task.startDate.toISOString().slice(0, 10) !== parsed.data.start) changes.push("start");
  if (task.endDate.toISOString().slice(0, 10) !== parsed.data.end) changes.push("end");
  if ((task.dependsOnId ?? null) !== dep) changes.push("dep");
  for (const change of changes) {
    await logActivity(user.name, `${project.name}: ${task.name} ${change} changed`);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function addTaskAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      name: z.string().trim().min(1, "Task name is required.").max(300),
      role: z.string().trim().max(120),
      owner: z.string().trim().max(120),
      start: zDate,
      end: zDate,
      dependsOnId: z.string(),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid task." };
  if (parsed.data.end < parsed.data.start) {
    return { error: "The end date cannot be before the start date." };
  }

  const project = await loadProject(parsed.data.projectId);
  if (!project) return { error: "That project no longer exists." };
  const dep = depId(parsed.data.dependsOnId);
  if (dep && !project.tasks.some((task) => task.id === dep)) {
    return { error: "Choose a valid dependency." };
  }

  const last = await prisma.task.aggregate({
    where: { projectId: project.id },
    _max: { sortOrder: true },
  });
  await prisma.task.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      role: parsed.data.role || "Unassigned",
      owner: parsed.data.owner,
      startDate: new Date(`${parsed.data.start}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.end}T00:00:00.000Z`),
      status: 0,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      dependsOnId: dep,
    },
  });
  await logActivity(user.name, `${project.name}: task added ${parsed.data.name}`);
  revalidatePath("/", "layout");
  return { message: "Task added." };
}

export async function deleteTaskAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete tasks." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), taskId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid task." };

  const task = await prisma.task.findFirst({
    where: { id: parsed.data.taskId, projectId: parsed.data.projectId },
  });
  if (!task) return { error: "That task was not found." };

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId: parsed.data.projectId, dependsOnId: task.id },
      data: { dependsOnId: null },
    }),
    prisma.task.delete({ where: { id: task.id } }),
  ]);
  revalidatePath("/", "layout");
  return {};
}

export async function nextTaskStatusAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), taskId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid task." };

  const project = await loadProject(parsed.data.projectId);
  const task = project?.tasks.find((item) => item.id === parsed.data!.taskId);
  if (!project || !task) return { error: "That task was not found." };

  const next = (task.status + 1) % 4;
  const dependency = task.dependsOnId
    ? project.tasks.find((item) => item.id === task.dependsOnId)
    : null;
  if (next === 1 && dependency && dependency.status !== 3) {
    return { error: `Waiting on “${dependency.name}”.` };
  }

  await prisma.task.update({ where: { id: task.id }, data: { status: next } });
  await logActivity(user.name, `${project.name}: ${task.name} → ${taskStatusLabel(next)}`);
  revalidatePath("/", "layout");
  return {};
}

export async function addTaskRoleAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      name: z.string().trim().min(1, "Type the role name first.").max(120),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid role." };

  const settings = await getSettings();
  if (settings.taskRoles.some((role) => role.toLowerCase() === parsed.data!.name.toLowerCase())) {
    return { error: "That role already exists." };
  }
  await saveSetting("taskRoles", [...settings.taskRoles, parsed.data.name]);
  await logActivity(user.name, `Added role ${parsed.data.name}`);
  revalidatePath("/", "layout");
  return { message: "Role added." };
}

export async function saveGanttAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      from: z.union([zDate, z.literal("")]),
      to: z.union([zDate, z.literal("")]),
      unit: z.enum(["day", "week", "month"]),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid period." };
  if (parsed.data.from && parsed.data.to && parsed.data.to <= parsed.data.from) {
    return { error: "The To date must be after the From date." };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, extra: true },
  });
  if (!project) return { error: "That project no longer exists." };

  const extra = (project.extra ?? {}) as Record<string, unknown>;
  await prisma.project.update({
    where: { id: project.id },
    data: {
      extra: {
        ...extra,
        gantt: {
          from: parsed.data.from,
          to: parsed.data.to,
          unit: parsed.data.unit,
        },
      },
    },
  });
  revalidatePath("/", "layout");
  return {};
}
