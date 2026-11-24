import { Suspense } from "react";
import { ScheduleView } from "@/components/views/schedule-view";
import { getSettings } from "@/lib/data";
import { projectPageData } from "@/lib/project-page";

async function Content({ params }: { params: Promise<{ projectId: string }> }) {
  const [{ user, project }, settings] = await Promise.all([
    projectPageData(params),
    getSettings(),
  ]);
  return <ScheduleView project={project} settings={settings} role={user.role} />;
}

export default function SchedulePage({
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
