import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const avatar = await prisma.userAvatar.findUnique({
    where: { userId: id },
    select: { mimeType: true, size: true, data: true },
  });
  if (!avatar) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType || "application/octet-stream",
      "Content-Length": String(avatar.size),
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
