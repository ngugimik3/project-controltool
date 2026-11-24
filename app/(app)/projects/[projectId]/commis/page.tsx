import { Suspense } from "react";
import { CommissioningView } from "@/components/views/phase-views";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { user, project } = await projectPageData(params);
  return <CommissioningView project={project} role={user.role} />;
}

export default function CommissioningPage({
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
