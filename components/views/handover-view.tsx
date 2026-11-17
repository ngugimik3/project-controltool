import { ActionButton, AutoForm } from "@/components/forms";
import { saveHandoverRefAction, toggleHandoverReadyAction } from "@/lib/actions/handover";
import type { ProjectView } from "@/lib/types";

export function HandoverView({ project }: { project: ProjectView }) {
  const ready = project.docs.filter((doc) => doc.ready).length;

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kl">Documents ready</div>
          <div className="kv">
            {ready} of {project.docs.length}
          </div>
        </div>
      </div>

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
    </>
  );
}
