import { Checklist } from "@/components/checklist";
import { PageHeader } from "@/components/page-header";
import { ReviewForm, ReviewList } from "@/components/reviews";
import { PlanVisitForm, VisitRow } from "@/components/visit-row";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function SurveyView({ project, role }: { project: ProjectView; role: Role }) {
  const reviews = project.stageReviews.filter((review) => review.key === "survey");
  const canDelete = role === "admin" || role === "superadmin";

  return (
    <div className="view-stack">
      <PageHeader
        title="Site survey"
        subtitle={`${project.name} · ${project.visits.length} visit${project.visits.length === 1 ? "" : "s"} logged`}
      />

      <div className="card">
        <div className="ct">Previsits and site visits</div>
        {project.visits.length ? (
          <div className="visit-list">
            {project.visits.map((visit) => (
              <VisitRow
                key={visit.id}
                projectId={project.id}
                visit={visit}
                canDelete={canDelete}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            No site visits planned yet. Use the form below to plan the first one.
          </div>
        )}
      </div>

      <PlanVisitForm projectId={project.id} />

      <Checklist project={project} kind="survey" role={role} />

      <div className="card">
        <div className="ct">Survey reviews and status updates</div>
        <ReviewList reviews={reviews} />
        <ReviewForm projectId={project.id} keyName="survey" />
      </div>
    </div>
  );
}
