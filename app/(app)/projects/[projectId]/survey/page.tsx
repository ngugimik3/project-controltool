import { Suspense } from "react";
import { SurveyView } from "@/components/views/survey-view";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const { user, project } = await projectPageData(params);
  return <SurveyView project={project} role={user.role} />;
}

export default function SurveyPage({
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
