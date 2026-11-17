import { prisma } from "./prisma";

export async function logActivity(userName: string, action: string): Promise<void> {
  await prisma.activityLog.create({ data: { userName, action } });
}
