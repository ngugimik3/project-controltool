"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { importBackup } from "@/lib/backup";
import { normalizeRole, ROLE_LABEL } from "@/lib/roles";
import { parseForm } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function addUserAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser("superadmin");
  const parsed = parseForm(
    z.object({
      name: z.string().trim().min(1, "Name is required.").max(120),
      username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters.")
        .max(30, "Username must be at most 30 characters.")
        .regex(/^[a-zA-Z0-9_.]+$/, "Use letters, numbers, dots or underscores only."),
      password: z.string().min(8, "Password must be at least 8 characters.").max(128),
      role: z.enum(["superadmin", "admin", "user"]),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid user." };

  const username = parsed.data.username.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return { error: "Username already exists." };

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: `${username}@users.project-control.local`,
        password: parsed.data.password,
        username,
      },
    });
    const user =
      result.user ??
      (await prisma.user.findUnique({ where: { username }, select: { id: true } }));
    if (!user) return { error: "Could not create that user." };

    await prisma.user.update({
      where: { id: user.id },
      data: { role: normalizeRole(parsed.data.role), active: true },
    });
  } catch (error) {
    console.error("add user failed", error);
    return { error: "Could not create that user. The username may already be taken." };
  }

  await logActivity(actor.name, `Created user ${username}`);
  revalidatePath("/", "layout");
  return { message: `User @${username} created as ${ROLE_LABEL[parsed.data.role]}.` };
}

export async function deleteUserAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser("superadmin");
  const parsed = parseForm(
    z.object({ userId: z.string().min(1) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid user." };
  if (parsed.data.userId === actor.id) {
    return { error: "You cannot delete your own account." };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, username: true, role: true },
  });
  if (!user) return { error: "That user was not found." };
  if (user.role === "superadmin") {
    const count = await prisma.user.count({ where: { role: "superadmin" } });
    if (count <= 1) return { error: "You cannot delete the last superadmin." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  await logActivity(actor.name, `Deleted user ${user.username ?? user.id}`);
  revalidatePath("/", "layout");
  return { message: "User deleted." };
}

export async function importBackupAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser("superadmin");
  const parsed = parseForm(
    z.object({
      backup: z.string().min(1, "Paste a backup first.").max(24_000_000),
      confirm: z.string(),
    }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid backup." };
  if (parsed.data.confirm.trim() !== "REPLACE") {
    return { error: 'Type REPLACE to confirm replacing all projects.' };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(parsed.data.backup);
  } catch {
    return { error: "That is not valid JSON." };
  }

  let count = 0;
  try {
    count = await importBackup(payload, actor.name);
  } catch (error) {
    console.error("import failed", error);
    return {
      error: error instanceof Error ? error.message : "The backup could not be imported.",
    };
  }

  revalidatePath("/", "layout");
  return { message: `Backup imported: ${count} project(s).` };
}


export async function setUserRoleAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser("superadmin");
  const parsed = parseForm(
    z.object({ userId: z.string().min(1), role: z.enum(["superadmin", "admin", "user"]) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid role." };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, username: true, role: true, active: true },
  });
  if (!target) return { error: "That user was not found." };

  const nextRole = normalizeRole(parsed.data.role);
  if (target.role === "superadmin" && nextRole !== "superadmin" && target.active) {
    const activeSuperadmins = await prisma.user.count({
      where: { role: "superadmin", active: true },
    });
    if (activeSuperadmins <= 1) {
      return { error: "You cannot demote the last active superadmin." };
    }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: nextRole },
  });
  await logActivity(
    actor.name,
    `Changed role for ${target.username ?? target.id} to ${ROLE_LABEL[nextRole]}`,
  );
  revalidatePath("/", "layout");
  return { message: "Role updated." };
}

export async function setUserActiveAction(formData: FormData): Promise<ActionResult> {
  const actor = await requireUser("superadmin");
  const parsed = parseForm(
    z.object({ userId: z.string().min(1), active: z.enum(["true", "false"]) }),
    formData,
  );
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Invalid state." };

  const active = parsed.data.active === "true";
  if (active === false && parsed.data.userId === actor.id) {
    return { error: "You cannot deactivate your own account." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, username: true, role: true, active: true },
  });
  if (!target) return { error: "That user was not found." };
  if (!active && target.role === "superadmin") {
    const activeSuperadmins = await prisma.user.count({
      where: { role: "superadmin", active: true },
    });
    if (activeSuperadmins <= 1) {
      return { error: "You cannot deactivate the last active superadmin." };
    }
  }

  await prisma.user.update({ where: { id: target.id }, data: { active } });
  if (!active) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }
  await logActivity(
    actor.name,
    `${active ? "Activated" : "Deactivated"} user ${target.username ?? target.id}`,
  );
  revalidatePath("/", "layout");
  return { message: active ? "User activated." : "User deactivated." };
}
