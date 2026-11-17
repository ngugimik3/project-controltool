import { randomUUID } from "node:crypto";
import { authCore } from "./auth-config";
import { prisma } from "./prisma";
import type { Role } from "./roles";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

export async function hashPassword(password: string): Promise<string> {
  const context = await authCore.$context;
  return context.password.hash(password);
}

/**
 * Creates a user with a username and password without touching the current session.
 * (Using the sign-up endpoint from an admin session would sign the admin in as the new user.)
 */
export async function createUserRecord(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
}): Promise<string> {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Username must be 3 to 30 letters, numbers, dots or underscores.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new Error("That username already exists.");

  const id = randomUUID();
  const password = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id,
        name: input.name.trim() || username,
        email: `${username}@pct.local`,
        emailVerified: true,
        username,
        displayUsername: input.username.trim(),
        role: input.role,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password,
      },
    }),
  ]);

  return id;
}
