"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parseForm, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const money = z.coerce.number().min(0, "Amounts cannot be negative.").max(1_000_000_000);

export async function addCostLineAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      code: z.string().trim().min(1, "Enter a cost code.").max(300),
      budget: z.union([money, z.literal("")]).transform((value) => (value === "" ? 0 : value)),
      actual: z.union([money, z.literal("")]).transform((value) => (value === "" ? 0 : value)),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid cost line." };

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  });
  if (!project) return { error: "That project no longer exists." };

  await prisma.costLine.create({
    data: {
      projectId: project.id,
      code: parsed.data.code,
      budget: parsed.data.budget,
      actual: parsed.data.actual,
    },
  });
  revalidatePath("/", "layout");
  return { message: "Cost line added." };
}

export async function deleteCostLineAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete cost lines." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), lineId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid cost line." };

  const line = await prisma.costLine.findFirst({
    where: { id: parsed.data.lineId, projectId: parsed.data.projectId },
  });
  if (!line) return { error: "That cost line was not found." };
  await prisma.costLine.delete({ where: { id: line.id } });
  revalidatePath("/", "layout");
  return {};
}
