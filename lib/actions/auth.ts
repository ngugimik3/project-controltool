"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../prisma";

export type LoginState = { error?: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void _previous;
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, active: true },
  });
  if (user && !user.active) {
    return { error: "This account is deactivated. Ask an admin." };
  }

  try {
    await auth.api.signInUsername({
      body: { username, password },
      headers: await headers(),
    });
  } catch (error) {
    console.error("sign-in failed", error instanceof Error ? error.message : error);
    return { error: "Invalid username or password." };
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    console.error("sign-out failed", error);
  }
  redirect("/login");
}
