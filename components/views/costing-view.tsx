import Link from "next/link";
import { ConfirmButton, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { addCostLineAction, deleteCostLineAction } from "@/lib/actions/costing";
import { finance, fmt } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function CostingView({ project, role }: { project: ProjectView; role: Role }) {
  const figures = finance(project);
  const margin = project.contract - figures.forecast;
  const canDelete = role === "admin" || role === "superadmin";
  const overBudget = figures.budget > 0 && figures.forecast > figures.budget;

  const kpis: { label: string; value: string; sub?: string; warn?: boolean }[] = [
    { label: "Project value", value: fmt(project.contract) },
    { label: "Budget", value: fmt(figures.budget) },
    { label: "Committed (POs)", value: fmt(figures.committed) },
    { label: "Actual", value: fmt(figures.actual) },
    {
      label: "Forecast",
      value: fmt(figures.forecast),
      sub: overBudget ? "Above budget" : undefined,
      warn: overBudget,
    },
    {
      label: "Margin",
      value: fmt(margin),
      sub: `${project.contract ? ((margin / project.contract) * 100).toFixed(1) : 0}%`,
      warn: margin < 0,
    },
  ];

  return (
    <div className="view-stack">
      <PageHeader
        title="Costing"
        subtitle={`${project.name} · forecast vs budget and margin`}
        actions={
          <>
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
              Export Excel
            </a>
          </>
        }
      />

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div className="kpi" key={kpi.label}>
            <div className="kl">{kpi.label}</div>
            <div className="kv" style={kpi.warn ? { color: "var(--rt)" } : undefined}>
              {kpi.value}
            </div>
            {kpi.sub ? <div className="ks">{kpi.sub}</div> : null}
          </div>
        ))}
      </div>
      <p className="sub">Forecast is the highest of budget, committed and actual.</p>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sc">
          <table className="tbl" style={{ border: 0, borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Cost code</th>
                <th className="n">Budget</th>
                <th className="n">Actual</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {project.costLines.length ? (
                project.costLines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.code}</td>
                    <td className="n">{fmt(line.budget)}</td>
                    <td className="n">{fmt(line.actual)}</td>
                    <td>
                      {canDelete ? (
                        <ConfirmButton
                          action={deleteCostLineAction}
                          fields={{ projectId: project.id, lineId: line.id }}
                          label="Del"
                          confirm="Delete this cost line?"
                        />
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty">
                    No cost lines yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="ct">Add cost line</div>
        <SubmitForm
          action={addCostLineAction}
          submitLabel="Add cost line"
          resetOnSuccess
          className="f"
          buttonClassName="btn btp"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input name="code" placeholder="Cost code, e.g. Materials" required />
          <input type="number" name="budget" min="0" step="0.01" placeholder="Budget" />
          <input type="number" name="actual" min="0" step="0.01" placeholder="Actual" />
        </SubmitForm>
      </div>
    </div>
  );
}
