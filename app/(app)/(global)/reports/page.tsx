import { Suspense } from "react";
import { ReportsView } from "@/components/views/reports-view";
import { requireUser } from "@/lib/auth";
import { getProjects } from "@/lib/data";

async function ReportsContent() {
  await requireUser();
  const projects = await getProjects();
  return <ReportsView projects={projects} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <ReportsContent />
    </Suspense>
  );
}
