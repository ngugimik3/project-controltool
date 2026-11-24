import { Suspense } from "react";
import { SupportView } from "@/components/views/phase-views";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { user, project } = await projectPageData(params);
  return <SupportView project={project} role={user.role} />;
}

export default function SupportPage({
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
