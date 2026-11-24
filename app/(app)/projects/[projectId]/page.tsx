import { Suspense } from "react";
import { ProjectOverviewView } from "@/components/views/project-overview-view";
import { getSettings } from "@/lib/data";
import { projectPageData } from "@/lib/project-page";

async function OverviewContent({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { user, project } = await projectPageData(params);
  const settings = await getSettings();
  return (
    <ProjectOverviewView
      project={project}
      settings={settings}
      role={user.role}
    />
  );
}

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <OverviewContent params={params} />
    </Suspense>
  );
}
