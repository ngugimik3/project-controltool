import { finance, fmt, isPoSlipping, isTaskOverdue, averageProgress, projectAlerts, CLOSED_STAGE } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";
import { ProjectTable } from "@/components/project-table";

export function DashboardView({
  projects,
  project,
  role,
}: {
  projects: ProjectView[];
  project: ProjectView | null;
  role: Role;
}) {
  const overdue = projects.reduce(
    (sum, item) => sum + item.tasks.filter((task) => isTaskOverdue(task)).length,
    0,
  );
  const slipping = projects.reduce(
    (sum, item) => sum + item.purchaseOrders.filter((po) => isPoSlipping(po)).length,
    0,
  );
  const margin = projects.reduce(
    (sum, item) => sum + item.contract - finance(item).forecast,
    0,
  );
  const active = projects.filter((item) => item.stage < CLOSED_STAGE).length;
  const average = averageProgress(projects);
  const alerts = project ? projectAlerts(project) : [];

  const kpis: [string, string][] = [
    ["Active projects", String(active)],
    ["Average progress", `${average}%`],
    ["Overdue tasks", String(overdue)],
    ["Slipping purchase orders", String(slipping)],
    ["Margin, all projects (forecast)", fmt(margin)],
  ];

  return (
    <>
      <div className="kpi-grid">
        {kpis.map(([label, value]) => (
          <div className="kpi" key={label}>
            <div className="kl">{label}</div>
            <div className="kv">{value}</div>
          </div>
        ))}
      </div>

      {project ? (
        <div className="card">
          <div className="ct">Alerts for {project.name}</div>
          {alerts.length ? (
            alerts.map((alert) => (
              <p className="warn" key={alert}>
                {alert}
              </p>
            ))
          ) : (
            <p className="sub">Nothing overdue or slipping.</p>
          )}
        </div>
      ) : null}

      <div className="card">
        <div className="ct">All projects</div>
        <ProjectTable projects={projects} role={role} />
      </div>
    </>
  );
}
