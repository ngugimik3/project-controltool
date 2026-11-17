import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttachment } from "@/lib/data";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const attachment = await getAttachment(id);
  if (!attachment) return new Response("Not found", { status: 404 });

  const filename = attachment.name.replace(/["\\\r\n]/g, "_");
  const inline =
    attachment.mimeType.startsWith("image/") &&
    attachment.mimeType !== "image/svg+xml";

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": String(attachment.size),
      "Content-Disposition": `${
        inline ? "inline" : "attachment"
      }; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
