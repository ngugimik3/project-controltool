import { Suspense } from "react";
import { CostingView } from "@/components/views/costing-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { user, project } = await projectPageData(params);
  return <CostingView project={project} role={user.role} />;
}

export default function CostingPage({
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
