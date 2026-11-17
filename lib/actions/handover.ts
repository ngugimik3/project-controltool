"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseForm, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function saveHandoverRefAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      docId: zShortText.min(1),
      ref: z.string().max(1000),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid reference." };

  const doc = await prisma.handoverDoc.findFirst({
    where: { id: parsed.data.docId, projectId: parsed.data.projectId },
  });
  if (!doc) return { error: "That handover document was not found." };

  await prisma.handoverDoc.update({
    where: { id: doc.id },
    data: { ref: parsed.data.ref },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function toggleHandoverReadyAction(formData: FormData): Promise<ActionResult> {
  await requireUser();
  const parsed = parseForm(
    z.object({
      projectId: zShortText.min(1),
      docId: zShortText.min(1),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid document." };

  const doc = await prisma.handoverDoc.findFirst({
    where: { id: parsed.data.docId, projectId: parsed.data.projectId },
  });
  if (!doc) return { error: "That handover document was not found." };

  await prisma.handoverDoc.update({
    where: { id: doc.id },
    data: { ready: !doc.ready },
  });
  revalidatePath("/", "layout");
  return {};
}
