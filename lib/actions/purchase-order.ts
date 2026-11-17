"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { parseForm, zDate, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function addPurchaseOrderAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      item: z.string().trim().min(1).max(300),
      supplier: z.string().trim().min(1).max(300),
      needBy: zDate,
      promisedBy: zDate,
      cost: z.coerce.number().min(0, "Cost cannot be negative.").max(1_000_000_000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) {
    return { error: parsed.error ?? "Fill in every purchase order field." };
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true },
  });
  if (!project) return { error: "That project no longer exists." };

  await prisma.purchaseOrder.create({
    data: {
      projectId: project.id,
      item: parsed.data.item,
      supplier: parsed.data.supplier,
      needBy: new Date(`${parsed.data.needBy}T00:00:00.000Z`),
      promisedBy: new Date(`${parsed.data.promisedBy}T00:00:00.000Z`),
      cost: parsed.data.cost,
      status: 0,
      waybill: "",
    },
  });
  await logActivity(user.name, `PO added: ${parsed.data.item}`);
  revalidatePath("/", "layout");
  return { message: "Purchase order added." };
}

export async function savePurchaseOrderAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      poId: zShortText.min(1),
      status: z.coerce.number().int().min(0).max(8),
      waybill: z.string().max(300),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid purchase order." };

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: parsed.data.poId, projectId: parsed.data.projectId },
  });
  if (!po) return { error: "That purchase order was not found." };

  await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { status: parsed.data.status, waybill: parsed.data.waybill },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function deletePurchaseOrderAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can delete purchase orders." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), poId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid purchase order." };

  const po = await prisma.purchaseOrder.findFirst({
    where: { id: parsed.data.poId, projectId: parsed.data.projectId },
  });
  if (!po) return { error: "That purchase order was not found." };
  await prisma.purchaseOrder.delete({ where: { id: po.id } });
  revalidatePath("/", "layout");
  return {};
}
