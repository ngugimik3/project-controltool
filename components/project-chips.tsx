import { finance, fmt, progress } from "@/lib/planner";
import { handoverReadiness } from "@/lib/handover";
import { HANDOVER_STAGE } from "@/lib/dashboard";
import type { ProjectView } from "@/lib/types";

export function ProjectChips({ project }: { project: ProjectView | null }) {
  if (!project) {
    return <div className="topbar-meta"><span className="meta-chip">No project selected</span></div>;
  }

  const pct = progress(project);
  const money = finance(project);
  const overBudget = money.budget > 0 && money.forecast > money.budget;
  const readiness = handoverReadiness(project);
  const showHandover = project.stage >= HANDOVER_STAGE - 1;

  return (
    <div className="topbar-meta" id="meta">
      <span className="meta-chip" title="Client">
        <strong>{project.client}</strong>
      </span>
      <span className="meta-chip">{project.type}</span>
      <span className="meta-chip">
        Value <strong>{fmt(project.contract)}</strong>
      </span>
      <span className="meta-chip" title={`${pct}% complete`}>
        <span className="progress-ring" style={{ ["--pct" as string]: pct }} />
        <strong>{pct}%</strong>
      </span>
      {money.budget > 0 ? (
        <span
          className={`meta-chip${overBudget ? " warn" : ""}`}
          title="Forecast vs budget"
        >
          Cost{" "}
          <strong>
            {fmt(money.forecast)} / {fmt(money.budget)}
          </strong>
          {overBudget ? " over" : ""}
        </span>
      ) : null}
      {showHandover ? (
        <span className={`meta-chip${readiness.complete ? " ok" : ""}`}>
          Handover <strong>{readiness.percent}%</strong>
        </span>
      ) : null}
    </div>
  );
}
