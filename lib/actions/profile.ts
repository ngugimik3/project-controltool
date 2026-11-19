"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { auth, requireUser } from "@/lib/auth";
import { attachmentMime } from "@/lib/defaults";
import { prisma } from "@/lib/prisma";
import type { PasswordField, PasswordState, ProfileField, ProfileState } from "@/lib/types";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const PROFILE_FIELDS: ProfileField[] = ["name", "phone", "jobTitle", "department", "bio"];

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Your name is required.")
    .max(120, "Keep your name under 120 characters."),
  phone: z
    .string()
    .trim()
    .max(30, "Keep the phone number under 30 characters.")
    .regex(/^[0-9+()\s-]*$/, "Use digits, spaces and + ( ) - only."),
  jobTitle: z.string().trim().max(120, "Keep the job title under 120 characters."),
  department: z.string().trim().max(120, "Keep the department under 120 characters."),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters."),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "Keep the password under 128 characters."),
    confirmPassword: z.string().min(1, "Repeat the new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The new passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

function collectErrors<T extends string>(
  error: z.ZodError,
  allowed: readonly T[],
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && (allowed as readonly string[]).includes(key)) {
      const field = key as T;
      errors[field] ??= issue.message;
    }
  }
  return errors;
}

export async function updateProfileAction(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  void _previous;
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    jobTitle: String(formData.get("jobTitle") ?? ""),
    department: String(formData.get("department") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectErrors(parsed.error, PROFILE_FIELDS),
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        jobTitle: parsed.data.jobTitle || null,
        department: parsed.data.department || null,
        bio: parsed.data.bio || null,
      },
    });
  } catch (error) {
    console.error("update profile failed", error);
    return { ok: false, error: "Could not save your profile. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function uploadAvatarAction(formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }

  const mime = attachmentMime(file);
  if (!AVATAR_TYPES.has(mime)) {
    const message = "Use a PNG, JPG or WebP image.";
    return { ok: false, error: message, fieldErrors: { avatar: message } };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    const message = "Keep the image under 2 MB.";
    return { ok: false, error: message, fieldErrors: { avatar: message } };
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const avatarUrl = `/api/avatar/${user.id}?v=${Date.now()}`;

  try {
    await prisma.userAvatar.upsert({
      where: { userId: user.id },
      create: { userId: user.id, mimeType: mime, size: file.size, data },
      update: { mimeType: mime, size: file.size, data },
    });
    // Keep Better Auth's own image field in sync for anything reading the session user.
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl, image: avatarUrl },
    });
  } catch (error) {
    console.error("avatar upload failed", error);
    return { ok: false, error: "Could not save that image. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Avatar updated." };
}

export async function removeAvatarAction(): Promise<ProfileState> {
  const user = await requireUser();

  try {
    await prisma.$transaction([
      prisma.userAvatar.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: null, image: null },
      }),
    ]);
  } catch (error) {
    console.error("avatar removal failed", error);
    return { ok: false, error: "Could not remove your avatar. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Avatar removed." };
}

export async function changePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  void _previous;
  await requireUser();

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    const fields: PasswordField[] = ["currentPassword", "newPassword", "confirmPassword"];
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectErrors(parsed.error, fields),
    };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/invalid password/i.test(message)) {
      const text = "Your current password is incorrect.";
      return {
        ok: false,
        error: text,
        fieldErrors: { currentPassword: text },
      };
    }
    console.error("change password failed", message || error);
    return {
      ok: false,
      error: message || "Could not change your password. Try again.",
    };
  }

  return {
    ok: true,
    message: "Password changed. Other sessions were signed out.",
  };
}
