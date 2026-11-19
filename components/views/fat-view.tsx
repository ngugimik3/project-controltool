import { Checklist } from "@/components/checklist";
import { PageHeader } from "@/components/page-header";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function FatView({ project, role }: { project: ProjectView; role: Role }) {
  return (
    <div className="view-stack">
      <PageHeader
        title="FAT"
        subtitle={`${project.name} · factory acceptance testing`}
      />
      <Checklist project={project} kind="fat" role={role} />
      <p className="sub">A failed FAT item creates a rework task on the Schedule tab.</p>
    </div>
  );
}
