import { getCurrentUser } from "@/lib/auth";
import { buildBackup } from "@/lib/backup";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "admin" && user.role !== "superadmin") {
    return new Response("Forbidden", { status: 403 });
  }

  const backup = await buildBackup();
  const filename = `project-control-backup-${backup.exportedAt.slice(0, 10)}.json`;
  return new Response(JSON.stringify(backup), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
