import { Suspense } from "react";
import { ExecutionView } from "@/components/views/execution-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { project } = await projectPageData(params);
  return <ExecutionView project={project} />;
}

export default function ExecutionPage({
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
