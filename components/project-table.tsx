import { deleteProjectAction } from "@/lib/actions/project";
import { STAGES } from "@/lib/constants";
import { fmt, progress } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import { can, type Role } from "@/lib/roles";
import { ConfirmButton } from "./forms";
import { OpenProjectButton } from "./open-project-button";

export function ProjectTable({
  projects,
  role,
}: {
  projects: ProjectView[];
  role: Role;
}) {
  if (!projects.length) {
    return <div className="empty">No projects yet. Create one on the Projects tab.</div>;
  }

  return (
    <div className="sc">
      <table className="tbl">
        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>Stage</th>
            <th>Progress</th>
            <th>Tasks done</th>
            <th className="n">Project Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const percent = progress(project);
            const done = project.tasks.filter((task) => task.status === 3).length;
            return (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.client}</td>
                <td>
                  <span className="badge ba">{STAGES[project.stage]}</span>
                </td>
                <td style={{ minWidth: 130 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 8,
                        background: "var(--s1)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percent}%`,
                          height: "100%",
                          background: "var(--ac)",
                        }}
                      />
                    </div>
                    <span>{percent}%</span>
                  </div>
                </td>
                <td>
                  {done}/{project.tasks.length}
                </td>
                <td className="n">{fmt(project.contract)}</td>
                <td>
                  <div className="grow" style={{ marginBottom: 0, flexWrap: "nowrap" }}>
                    <OpenProjectButton projectId={project.id} />
                    {can(role, "superadmin") ? (
                      <ConfirmButton
                        action={deleteProjectAction}
                        fields={{ projectId: project.id }}
                        label="Delete"
                        confirm="Delete this project and everything in it?"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
