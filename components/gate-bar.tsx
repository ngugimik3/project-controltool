import { STAGES } from "@/lib/constants";
import { can, type Role } from "@/lib/roles";
import type { ProjectView } from "@/lib/types";
import { GateButton } from "./gate-button";

export function GateBar({ project, role }: { project: ProjectView | null; role: Role }) {
  if (!project) return null;

  return (
    <div id="gate">
      <div className="rail">
        {STAGES.map((stage, index) => (
          <span
            key={stage}
            className={index === project.stage ? "cur" : index < project.stage ? "done" : ""}
          >
            {stage}
          </span>
        ))}
      </div>
      {project.stage < STAGES.length - 1 && can(role, "admin", "superadmin") ? (
        <GateButton projectId={project.id} nextStage={STAGES[project.stage + 1]} />
      ) : null}
    </div>
  );
}
