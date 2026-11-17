"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { getProject, getSettings, PROJECT_COOKIE } from "@/lib/data";
import { blockers, stageLabel } from "@/lib/planner";
import { STAGES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formValue, parseForm, zShortText } from "@/lib/validation";
import { addDays, todayISO } from "@/lib/planner";
import { CHECKLIST_SEEDS, HANDOVER_DOCS, PARAM_GROUPS, WBS } from "@/lib/defaults";
import { saveSetting } from "@/lib/settings";
import type { ActionResult } from "@/lib/types";

export async function selectProjectAction(projectId: string): Promise<ActionResult> {
  await requireUser();
  const parsed = z.string().min(1).safeParse(projectId);
  if (!parsed.success) return { error: "Select a valid project." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data },
    select: { id: true },
  });
  if (!project) return { error: "That project no longer exists." };

  (await cookies()).set(PROJECT_COOKIE, project.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return {};
}

export async function passGateAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can pass a gate." };
  }

  const parsed = parseForm(z.object({ projectId: zShortText.min(1) }), formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid input." };

  const project = await getProject(parsed.data.projectId);
  if (!project) return { error: "Create or select a project first." };
  if (project.stage >= STAGES.length - 1) {
    return { error: "This project is already closed." };
  }

  const pending = blockers(project);
  if (pending.length > 0) return { blockers: pending };

  await prisma.project.update({
    where: { id: project.id },
    data: { stage: project.stage + 1 },
  });
  await logActivity(
    user.name,
    `Gate passed: ${project.name} → ${stageLabel(project.stage + 1)}`,
  );
  revalidatePath("/", "layout");
  return {
    message: `Moved to ${stageLabel(project.stage + 1)}.`,
  };
}

const projectIdSchema = z.object({ projectId: zShortText.min(1) });

export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const name = formValue(formData, "name").trim();
  const client = formValue(formData, "client").trim();
  const contractValue = formValue(formData, "contract").trim();

  if (!name || !client || !contractValue) {
    return { error: "Name, client and project value are required." };
  }

  const parsed = parseForm(
    z.object({
      name: z.string().trim().min(1).max(200),
      client: z.string().trim().min(1).max(200),
      type: z.string().trim().min(1).max(120),
      contract: z.coerce.number().finite().min(0, "Project value cannot be negative."),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid project." };

  const start = todayISO();
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name: parsed.data.name,
        client: parsed.data.client,
        type: parsed.data.type,
        contract: parsed.data.contract,
        tasks: {
          create: WBS.map(([taskName, role, offset, duration], index) => ({
            name: taskName,
            role,
            owner: "",
            startDate: new Date(`${addDays(start, offset)}T00:00:00.000Z`),
            endDate: new Date(`${addDays(start, offset + duration)}T00:00:00.000Z`),
            status: 0,
            sortOrder: index,
          })),
        },
        checkItems: {
          create: Object.entries(CHECKLIST_SEEDS).flatMap(([kind, items], kindIndex) =>
            items.map((item, index) => ({
              kind,
              item,
              reading: "",
              result: "",
              note: "",
              status: 0,
              sortOrder: kindIndex * 100 + index,
            })),
          ),
        },
        docs: {
          create: HANDOVER_DOCS.map((slot, index) => ({
            slot,
            ref: "",
            ready: false,
            sortOrder: index,
          })),
        },
      },
    });

    const tasks = await tx.task.findMany({
      where: { projectId: created.id },
      orderBy: { sortOrder: "asc" },
    });
    for (const [index, wbs] of WBS.entries()) {
      const dependency = wbs[4];
      if (dependency == null) continue;
      const task = tasks[index];
      const dependsOn = tasks[dependency - 1];
      if (task && dependsOn) {
        await tx.task.update({
          where: { id: task.id },
          data: { dependsOnId: dependsOn.id },
        });
      }
    }
    return created;
  });

  (await cookies()).set(PROJECT_COOKIE, project.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  await logActivity(user.name, `Created project ${project.name}`);
  revalidatePath("/", "layout");
  return { message: "Project created with tasks, checklists and handover list." };
}

export async function updateProjectAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can edit project details." };
  }
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      name: z.string().trim().min(1).max(200),
      client: z.string().trim().min(1).max(200),
      type: z.string().trim().min(1).max(120),
      contract: z.coerce.number().finite().min(0),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid project." };

  const existing = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!existing) return { error: "That project no longer exists." };

  await prisma.project.update({
    where: { id: parsed.data.projectId },
    data: {
      name: parsed.data.name,
      client: parsed.data.client,
      type: parsed.data.type,
      contract: parsed.data.contract,
    },
  });
  await logActivity(user.name, `Updated project ${parsed.data.name}`);
  revalidatePath("/", "layout");
  return { message: "Project details saved." };
}

export async function deleteProjectAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "superadmin")) {
    return { error: "Only superadmins can delete a project." };
  }
  const parsed = parseForm(projectIdSchema, formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid project." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, name: true },
  });
  if (!project) return { error: "That project no longer exists." };

  await prisma.project.delete({ where: { id: project.id } });
  const cookieStore = await cookies();
  if (cookieStore.get(PROJECT_COOKIE)?.value === project.id) {
    cookieStore.delete(PROJECT_COOKIE);
  }
  await logActivity(user.name, `Deleted project ${project.name}`);
  revalidatePath("/", "layout");
  return { message: "Project deleted." };
}

export async function saveProjectSpecAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      dim: z.string().trim().max(500),
      volt: z.string().trim().max(500),
      kw: z.string().trim().max(500),
      std: z.string().trim().max(2000),
      notes: z.string().max(20000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid spec." };

  const result = await prisma.project.updateMany({
    where: { id: parsed.data.projectId },
    data: {
      specDim: parsed.data.dim,
      specVolt: parsed.data.volt,
      specKw: parsed.data.kw,
      specStd: parsed.data.std,
      specNotes: parsed.data.notes,
    },
  });
  if (!result.count) return { error: "That project no longer exists." };
  revalidatePath("/", "layout");
  return {};
}

export async function addParamAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      groupName: z.enum(PARAM_GROUPS),
      name: z.string().trim().min(1, "Enter a parameter name.").max(200),
      value: z.string().trim().max(500),
      unit: z.string().trim().max(80),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid parameter." };

  const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project) return { error: "That project no longer exists." };

  await prisma.param.create({ data: parsed.data });
  revalidatePath("/", "layout");
  return { message: "Parameter added." };
}

export async function updateParamAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      paramId: zShortText.min(1),
      groupName: z.enum(PARAM_GROUPS),
      name: z.string().trim().min(1).max(200),
      value: z.string().trim().max(500),
      unit: z.string().trim().max(80),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid parameter." };

  const result = await prisma.param.updateMany({
    where: { id: parsed.data.paramId, projectId: parsed.data.projectId },
    data: {
      groupName: parsed.data.groupName,
      name: parsed.data.name,
      value: parsed.data.value,
      unit: parsed.data.unit,
    },
  });
  if (!result.count) return { error: "That parameter was not found." };
  revalidatePath("/", "layout");
  return {};
}

export async function deleteParamAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete parameters." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), paramId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid parameter." };

  await prisma.param.deleteMany({
    where: { id: parsed.data.paramId, projectId: parsed.data.projectId },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function addProjectTypeAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({ name: z.string().trim().min(1, "Type the category name first.").max(120) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid category." };

  const settings = await getSettings();
  if (settings.projectTypes.some((t) => t.toLowerCase() === parsed.data!.name.toLowerCase())) {
    return { error: "That category already exists." };
  }
  await saveSetting("projectTypes", [...settings.projectTypes, parsed.data.name]);
  await logActivity(user.name, `Added category ${parsed.data.name}`);
  revalidatePath("/", "layout");
  return { message: "Category added." };
}
