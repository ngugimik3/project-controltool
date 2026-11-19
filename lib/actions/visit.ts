"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { parseForm, zDate, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { fmtDate } from "@/lib/planner";

const visitType = z.enum([
  "Previsit",
  "Site survey",
  "Revisit",
  "Installation",
  "Commissioning",
  "Other",
]);
const visitStatus = z.enum(["Planned", "Done", "Cancelled"]);

function visitFields() {
  return {
    projectId: zShortText.min(1),
    date: zDate,
    type: visitType,
    who: z.string().max(500),
    purpose: z.string().max(20_000),
  };
}

async function projectName(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  return project;
}

export async function addVisitAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(z.object(visitFields()), formData);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid visit." };

  const project = await projectName(parsed.data.projectId);
  if (!project) return { error: "That project no longer exists." };

  await prisma.siteVisit.create({
    data: {
      projectId: project.id,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      type: parsed.data.type,
      who: parsed.data.who,
      purpose: parsed.data.purpose,
      notes: "",
      status: "Planned",
    },
  });
  await logActivity(
    user.name,
    `${project.name}: ${parsed.data.type} planned for ${fmtDate(parsed.data.date)}`,
  );
  revalidatePath("/", "layout");
  return { message: "Visit planned." };
}

export async function saveVisitAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      ...visitFields(),
      visitId: zShortText.min(1),
      notes: z.string().max(20_000),
      status: visitStatus,
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid visit." };

  const [project, visit] = await Promise.all([
    projectName(parsed.data.projectId),
    prisma.siteVisit.findFirst({
      where: { id: parsed.data.visitId, projectId: parsed.data.projectId },
    }),
  ]);
  if (!project || !visit) return { error: "That visit was not found." };

  await prisma.siteVisit.update({
    where: { id: visit.id },
    data: {
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      type: parsed.data.type,
      who: parsed.data.who,
      purpose: parsed.data.purpose,
      notes: parsed.data.notes,
      status: parsed.data.status,
    },
  });

  if (parsed.data.status !== visit.status) {
    await logActivity(
      user.name,
      `${project.name}: ${parsed.data.type} on ${fmtDate(parsed.data.date)} marked ${parsed.data.status}`,
    );
  }
  revalidatePath("/", "layout");
  return {};
}

export async function deleteVisitAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete visits." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), visitId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid visit." };

  const visit = await prisma.siteVisit.findFirst({
    where: { id: parsed.data.visitId, projectId: parsed.data.projectId },
  });
  if (!visit) return { error: "That visit was not found." };
  await prisma.siteVisit.delete({ where: { id: visit.id } });
  revalidatePath("/", "layout");
  return {};
}
