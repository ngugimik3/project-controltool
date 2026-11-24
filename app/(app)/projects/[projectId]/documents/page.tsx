import { Suspense } from "react";
import { DocumentsView } from "@/components/views/documents-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { project } = await projectPageData(params);
  return <DocumentsView project={project} />;
}

export default function DocumentsPage({
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
