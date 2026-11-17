import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "./prisma";

const extraOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/** Shared options. The Next.js instance in lib/auth.ts adds the cookie plugin. */
export const baseOptions = {
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, autoSignIn: false },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  trustedOrigins: ["http://localhost:3000", ...extraOrigins],
} satisfies BetterAuthOptions;

/** Instance for scripts and password hashing. It never touches request cookies. */
export const authCore = betterAuth({
  ...baseOptions,
  plugins: [username()],
});
