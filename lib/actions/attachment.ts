"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import {
  CHECK_KINDS,
  MAX_ATTACHMENT_BYTES,
  attachmentMime,
  isAllowedAttachmentMime,
} from "@/lib/defaults";
import { parseForm, zShortText } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function uploadAttachmentsAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");
  const scope = String(formData.get("scope") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (
    !projectId ||
    !([...CHECK_KINDS, "support"] as readonly string[]).includes(scope)
  ) {
    return { error: "Invalid attachment destination." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, signedBy: true },
  });
  if (!project) return { error: "That project no longer exists." };

  let checkItemId: string | null = null;
  let kind = scope;
  if (itemId) {
    const item = await prisma.checkItem.findFirst({
      where: { id: itemId, projectId: project.id },
      select: { id: true, kind: true },
    });
    if (!item) return { error: "That checklist item was not found." };
    checkItemId = item.id;
    kind = item.kind;
  }
  if (kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }

  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  const accepted: { file: File; mime: string }[] = [];
  let skipped = 0;
  for (const file of files) {
    const mime = attachmentMime(file);
    if (!file.size || file.size > MAX_ATTACHMENT_BYTES || !isAllowedAttachmentMime(mime)) {
      skipped += 1;
      continue;
    }
    accepted.push({ file, mime });
  }
  if (!accepted.length) {
    return {
      error: `Nothing uploaded. Use an image, PDF, CSV, text or JSON file up to 20 MB.`,
    };
  }

  await prisma.attachment.createMany({
    data: await Promise.all(
      accepted.map(async ({ file, mime }) => ({
        projectId: project.id,
        scope,
        checkItemId,
        name: file.name || "attachment",
        mimeType: mime,
        size: file.size,
        isImage: mime.startsWith("image/"),
        data: new Uint8Array(await file.arrayBuffer()),
        uploadedBy: user.name,
      })),
    ),
  });
  await logActivity(user.name, `${project.name}: files added to ${kind}`);
  revalidatePath("/", "layout");
  return {
    message: `${accepted.length} file${accepted.length === 1 ? "" : "s"} added${
      skipped ? `, ${skipped} skipped` : ""
    }.`,
  };
}

export async function deleteAttachmentAction(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!can(user.role, "admin", "superadmin")) {
    return { error: "Only admins can remove attachments." };
  }
  const parsed = parseForm(
    z.object({ projectId: zShortText.min(1), attachmentId: zShortText.min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid attachment." };

  const [project, attachment] = await Promise.all([
    prisma.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { id: true, signedBy: true },
    }),
    prisma.attachment.findFirst({
      where: { id: parsed.data.attachmentId, projectId: parsed.data.projectId },
      include: { checkItem: { select: { kind: true } } },
    }),
  ]);
  if (!project || !attachment) return { error: "That attachment was not found." };
  const kind = attachment.checkItem?.kind ?? attachment.scope;
  if (kind === "sat" && project.signedBy) {
    return { error: "SAT is signed off and locked." };
  }

  await prisma.attachment.delete({ where: { id: attachment.id } });
  revalidatePath("/", "layout");
  return {};
}
