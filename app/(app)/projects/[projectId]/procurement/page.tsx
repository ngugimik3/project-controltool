import { Suspense } from "react";
import { ProcurementView } from "@/components/views/procurement-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { user, project } = await projectPageData(params);
  return <ProcurementView project={project} role={user.role} />;
}

export default function ProcurementPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <Content params={params} />
    </Suspense>
  );
}
