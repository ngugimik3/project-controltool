import "./env";
import { createUserRecord } from "../lib/users";
import { prisma } from "../lib/prisma";

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local first.");
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (existing) {
    console.log(`User "${username}" already exists. Nothing to do.`);
    return;
  }

  await createUserRecord({ name, username, password, role: "superadmin" });
  console.log(`Created super admin "${username}".`);
}

main()
  .catch((error) => {
    console.error("FAIL", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
