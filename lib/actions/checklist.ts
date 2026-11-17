"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { CHECK_KINDS } from "@/lib/defaults";
import { addDays, checkLabel, todayISO } from "@/lib/planner";
import { TASK_STATUS } from "@/lib/constants";
import { parseForm, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const statusEnum = z.enum(TASK_STATUS);

async function loadCheck(projectId: string, itemId: string) {
  const [project, item] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, signedBy: true },
    }),
    prisma.checkItem.findFirst({ where: { id: itemId, projectId } }),
  ]);
  return { project, item };
}

export async function updateCheckItemAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      itemId: zShortText.min(1),
      field: z.enum(["item", "reading", "note"]),
      value: z.string().max(5000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid item." };

  const { project, item } = await loadCheck(parsed.data.projectId, parsed.data.itemId);
  if (!project || !item) return { error: "That checklist item was not found." };
  if (item.kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }

  await prisma.checkItem.update({
    where: { id: item.id },
    data: { [parsed.data.field]: parsed.data.value },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function setCheckResultAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      itemId: zShortText.min(1),
      result: z.enum(["Pass", "Fail", "NA"]),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid result." };

  const { project, item } = await loadCheck(parsed.data.projectId, parsed.data.itemId);
  if (!project || !item) return { error: "That checklist item was not found." };
  if (item.kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }
  const test = item.kind === "fat" || item.kind === "sat";
  if (test && parsed.data.result === "NA") return { error: "This item cannot be marked N/A." };
  if (!test && parsed.data.result === "Fail") return { error: "This item cannot be marked Fail." };

  await prisma.$transaction(async (tx) => {
    await tx.checkItem.update({
      where: { id: item.id },
      data: { result: parsed.data.result },
    });
    if (item.kind === "fat" && parsed.data.result === "Fail") {
      const name = `Rework: ${item.item}`;
      const existing = await tx.task.findFirst({ where: { projectId: project.id, name } });
      if (!existing) {
        const last = await tx.task.aggregate({
          where: { projectId: project.id },
          _max: { sortOrder: true },
        });
        await tx.task.create({
          data: {
            projectId: project.id,
            name,
            role: "Workshop Lead",
            owner: "",
            startDate: new Date(`${todayISO()}T00:00:00.000Z`),
            endDate: new Date(`${addDays(todayISO(), 3)}T00:00:00.000Z`),
            status: 0,
            sortOrder: (last._max.sortOrder ?? -1) + 1,
            dependsOnId: null,
          },
        });
      }
    }
  });

  await logActivity(
    user.name,
    `${project.name}: ${item.kind.toUpperCase()} ${item.item} → ${parsed.data.result}`,
  );
  revalidatePath("/", "layout");
  return {};
}

export async function addCheckItemAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      kind: z.enum(CHECK_KINDS),
      item: z.string().trim().min(1, "Type the new item first.").max(500),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid item." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, name: true, signedBy: true },
  });
  if (!project) return { error: "That project no longer exists." };
  if (parsed.data.kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }

  const last = await prisma.checkItem.aggregate({
    where: { projectId: project.id },
    _max: { sortOrder: true },
  });
  await prisma.checkItem.create({
    data: {
      projectId: project.id,
      kind: parsed.data.kind,
      item: parsed.data.item,
      reading: "",
      result: "",
      note: "",
      status: 0,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  await logActivity(
    user.name,
    `${project.name}: added ${checkLabel(parsed.data.kind)} item “${parsed.data.item}”`,
  );
  revalidatePath("/", "layout");
  return { message: "Item added." };
}

export async function deleteCheckItemAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete checklist items." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), itemId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid item." };

  const { project, item } = await loadCheck(parsed.data.projectId, parsed.data.itemId);
  if (!project || !item) return { error: "That checklist item was not found." };
  if (item.kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }
  await prisma.checkItem.delete({ where: { id: item.id } });
  revalidatePath("/", "layout");
  return {};
}

export async function setCheckStatusAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      itemId: zShortText.min(1),
      status: z.coerce.number().int().min(0).max(3),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid status." };

  const { project, item } = await loadCheck(parsed.data.projectId, parsed.data.itemId);
  if (!project || !item) return { error: "That step was not found." };
  if (item.kind !== "install" && item.kind !== "commis") {
    return { error: "That item does not have a step status." };
  }

  await prisma.checkItem.update({
    where: { id: item.id },
    data: { status: parsed.data.status },
  });
  await logActivity(
    user.name,
    `${project.name}: ${item.item} to ${TASK_STATUS[parsed.data.status]}`,
  );
  revalidatePath("/", "layout");
  return {};
}

export async function setNoteAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      key: z.enum(CHECK_KINDS),
      text: z.string().max(20000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid comment." };

  await prisma.note.upsert({
    where: { projectId_key: { projectId: parsed.data.projectId, key: parsed.data.key } },
    create: {
      projectId: parsed.data.projectId,
      key: parsed.data.key,
      text: parsed.data.text,
    },
    update: { text: parsed.data.text },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function addCheckReviewAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      itemId: zShortText.min(1),
      status: statusEnum,
      text: z.string().trim().min(1, "Write the review or status update first.").max(20000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid review." };

  const { project, item } = await loadCheck(parsed.data.projectId, parsed.data.itemId);
  if (!project || !item) return { error: "That checklist item was not found." };

  let version = 1;
  await prisma.$transaction(async (tx) => {
    const last = await tx.checkItemReview.aggregate({
      where: { checkItemId: item.id },
      _max: { version: true },
    });
    version = (last._max.version ?? 0) + 1;
    await tx.checkItemReview.create({
      data: {
        checkItemId: item.id,
        version,
        date: new Date(`${todayISO()}T00:00:00.000Z`),
        author: user.name,
        status: parsed.data.status,
        text: parsed.data.text,
      },
    });
  });

  await logActivity(user.name, `${project.name}: review v${version} added`);
  revalidatePath("/", "layout");
  return { message: "Review added." };
}

export async function addStageReviewAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      key: z.enum(["survey", "install", "commis"]),
      status: statusEnum,
      text: z.string().trim().min(1, "Write the review or status update first.").max(20000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid review." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, name: true },
  });
  if (!project) return { error: "That project no longer exists." };

  let version = 1;
  await prisma.$transaction(async (tx) => {
    const last = await tx.stageReview.aggregate({
      where: { projectId: project.id, key: parsed.data.key },
      _max: { version: true },
    });
    version = (last._max.version ?? 0) + 1;
    await tx.stageReview.create({
      data: {
        projectId: project.id,
        key: parsed.data.key,
        version,
        date: new Date(`${todayISO()}T00:00:00.000Z`),
        author: user.name,
        status: parsed.data.status,
        text: parsed.data.text,
      },
    });
  });

  await logActivity(user.name, `${project.name}: review v${version} added`);
  revalidatePath("/", "layout");
  return { message: "Review added." };
}

export async function signOffAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      name: z.string().trim().min(1, "Enter the client representative.").max(300),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid sign-off." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, name: true, signedBy: true },
  });
  if (!project) return { error: "That project no longer exists." };
  if (project.signedBy) return { error: "This SAT is already signed off." };

  await prisma.project.update({
    where: { id: project.id },
    data: { signedBy: parsed.data.name, signedAt: new Date() },
  });
  await logActivity(
    user.name,
    `SAT signed off: ${project.name} by ${parsed.data.name}`,
  );
  revalidatePath("/", "layout");
  return { message: "SAT signed off and locked." };
}
