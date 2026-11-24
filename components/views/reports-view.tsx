import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { STAGES } from "@/lib/constants";
import { fmt } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";

export function ReportsView({ projects }: { projects: ProjectView[] }) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Reports"
        subtitle="Schedule and costing reports for every project"
      />

      <div className="card">
        <div className="ct">Project reports</div>
        <div className="sc">
          <table className="tbl">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Stage</th>
                <th className="n">Value</th>
                <th>Schedule</th>
                <th>Costing</th>
              </tr>
            </thead>
            <tbody>
              {projects.length ? (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link
                        className="font-medium text-[var(--blue-dark)] hover:underline"
                        href={`/projects/${project.id}`}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td>{project.client}</td>
                    <td>{STAGES[project.stage] ?? STAGES[0]}</td>
                    <td className="n">{fmt(project.contract)}</td>
                    <td>
                      <div className="grow" style={{ marginBottom: 0, flexWrap: "nowrap" }}>
                        <Link
                          className="btn btg"
                          href={`/print/schedule?project=${project.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Print
                        </Link>
                        <a
                          className="btn btg"
                          href={`/api/export/schedule?project=${project.id}`}
                          download
                        >
                          Excel
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="grow" style={{ marginBottom: 0, flexWrap: "nowrap" }}>
                        <Link
                          className="btn btg"
                          href={`/print/costing?project=${project.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Print
                        </Link>
                        <a
                          className="btn btg"
                          href={`/api/export/costing?project=${project.id}`}
                          download
                        >
                          Excel
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    No projects yet. Create one on the Projects page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="ct">Checklists and closeout</div>
        <p className="sub">
          Open a project to print its survey, FAT, installation, commissioning, SAT,
          training, support, handover, or costing records.
        </p>
      </div>
    </div>
  );
}
