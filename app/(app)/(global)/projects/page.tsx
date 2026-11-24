import { Suspense } from "react";
import { ProjectsView } from "@/components/views/projects-view";
import { requireUser } from "@/lib/auth";
import { getProjects, getSettings } from "@/lib/data";

async function ProjectsContent() {
  const user = await requireUser();
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
  return (
    <ProjectsView
      project={null}
      projects={projects}
      settings={settings}
      role={user.role}
    />
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
