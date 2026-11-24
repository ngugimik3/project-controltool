import { Suspense } from "react";
import { HandoverView } from "@/components/views/handover-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { project } = await projectPageData(params);
  return <HandoverView project={project} />;
}

export default function HandoverPage({
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
