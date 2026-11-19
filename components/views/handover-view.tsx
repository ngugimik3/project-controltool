import { ActionButton, AutoForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { saveHandoverRefAction, toggleHandoverReadyAction } from "@/lib/actions/handover";
import { handoverReadiness } from "@/lib/handover";
import type { ProjectView } from "@/lib/types";

export function HandoverView({ project }: { project: ProjectView }) {
  const readiness = handoverReadiness(project);

  return (
    <div className="view-stack">
      <PageHeader
        title="Handover"
        subtitle={`${project.name} · closeout pack readiness`}
      />

      <div className="card">
        <div className="ct">Readiness</div>
        <div className="readiness">
          <div className="readiness-score">
            <div className="readiness-value">{readiness.percent}%</div>
            <div className="readiness-caption">
              {readiness.ready} of {readiness.total} docs ready
            </div>
          </div>
          <div>
            <p className="sub" style={{ marginBottom: 8 }}>
              {readiness.satSigned
                ? `SAT signed by ${project.signedBy}.`
                : "SAT client sign-off is still missing."}
            </p>
            {readiness.missing.length ? (
              <ul className="readiness-missing">
                {readiness.missing.map((slot) => (
                  <li key={slot}>{slot}</li>
                ))}
              </ul>
            ) : (
              <p className="sub">All handover slots are marked ready.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="ct">Documents</div>
        {project.docs.length ? (
          project.docs.map((doc) => (
            <div className="irow" key={doc.id}>
              <span className="b">{doc.slot}</span>
              <AutoForm action={saveHandoverRefAction}>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="docId" value={doc.id} />
                <input
                  aria-label="Reference"
                  name="ref"
                  defaultValue={doc.ref}
                  placeholder="File link or reference"
                  style={{ width: 240 }}
                />
              </AutoForm>
              <ActionButton
                action={toggleHandoverReadyAction}
                fields={{ projectId: project.id, docId: doc.id }}
                label={doc.ready ? "Ready" : "Mark ready"}
                className={`btn ${doc.ready ? "ok" : "btg"}`}
              />
            </div>
          ))
        ) : (
          <p className="empty">No handover documents yet.</p>
        )}
      </div>
    </div>
  );
}
