"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ProjectNoteCategory } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NoteState = { error?: string; ok?: boolean };

const categoryValues = Object.values(ProjectNoteCategory) as [
  (typeof ProjectNoteCategory)[keyof typeof ProjectNoteCategory],
  ...(typeof ProjectNoteCategory)[keyof typeof ProjectNoteCategory][],
];

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(1, "Write something first").max(5000),
  category: z.enum(categoryValues),
  projectId: z.string().optional(),
});

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const isAdmin = (session.user as { role?: string }).role === "admin";
  return { id: session.user.id, isAdmin };
}

async function assertCanModify(noteId: string, user: { id: string; isAdmin: boolean }) {
  const note = await prisma.projectNote.findUnique({ where: { id: noteId } });
  if (!note) throw new Error("Note not found");
  if (note.createdById !== user.id && !user.isAdmin) throw new Error("Not allowed");
  return note;
}

export async function saveNote(_: NoteState, formData: FormData): Promise<NoteState> {
  try {
    const user = await getUser();
    const parsed = schema.safeParse({
      id: formData.get("id") || undefined,
      title: formData.get("title") || undefined,
      body: formData.get("body"),
      category: formData.get("category"),
      projectId: formData.get("projectId") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { id, title, body, category, projectId } = parsed.data;
    const data = {
      title: title || null,
      body,
      category,
      projectId: projectId || null,
    };

    if (id) {
      await assertCanModify(id, user);
      await prisma.projectNote.update({ where: { id }, data });
    } else {
      await prisma.projectNote.create({
        data: { ...data, createdById: user.id },
      });
    }
    revalidatePath("/notes");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong" };
  }
}

export async function togglePin(id: string) {
  const user = await getUser();
  const note = await assertCanModify(id, user);
  await prisma.projectNote.update({ where: { id }, data: { pinned: !note.pinned } });
  revalidatePath("/notes");
}

export async function deleteNote(id: string) {
  const user = await getUser();
  await assertCanModify(id, user);
  await prisma.projectNote.delete({ where: { id } });
  revalidatePath("/notes");
}
