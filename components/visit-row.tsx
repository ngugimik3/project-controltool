import { AutoForm, ConfirmButton, SubmitForm } from "@/components/forms";
import { addVisitAction, deleteVisitAction, saveVisitAction } from "@/lib/actions/visit";
import { VISIT_STATUSES, VISIT_TYPES } from "@/lib/defaults";
import type { SiteVisitView } from "@/lib/types";

export function VisitRow({
  projectId,
  visit,
  canDelete,
}: {
  projectId: string;
  visit: SiteVisitView;
  canDelete: boolean;
}) {
  return (
    <div className="visit-row">
      <AutoForm action={saveVisitAction} className="visit-form">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="visitId" value={visit.id} />
        <label>
          <span className="kl">Date</span>
          <input
            aria-label="Visit date"
            type="date"
            name="date"
            defaultValue={visit.date}
          />
        </label>
        <label>
          <span className="kl">Type</span>
          <select aria-label="Visit type" name="type" defaultValue={visit.type}>
            {VISIT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="kl">Attendees</span>
          <input
            aria-label="Attendees"
            name="who"
            defaultValue={visit.who}
            placeholder="Names and roles"
          />
        </label>
        <label>
          <span className="kl">Purpose</span>
          <input
            aria-label="Purpose"
            name="purpose"
            defaultValue={visit.purpose}
            placeholder="What must be checked"
          />
        </label>
        <label>
          <span className="kl">Status</span>
          <select aria-label="Visit status" name="status" defaultValue={visit.status}>
            {VISIT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="visit-notes">
          <span className="kl">Findings</span>
          <input
            aria-label="Findings"
            name="notes"
            defaultValue={visit.notes}
            placeholder="Key findings"
          />
        </label>
      </AutoForm>
      {canDelete ? (
        <ConfirmButton
          action={deleteVisitAction}
          fields={{ projectId, visitId: visit.id }}
          label="Del"
          confirm="Delete this visit?"
          className="btn btd visit-delete"
        />
      ) : null}
    </div>
  );
}

export function PlanVisitForm({ projectId }: { projectId: string }) {
  return (
    <div className="card">
      <div className="ct">Plan a visit</div>
      <SubmitForm
        action={addVisitAction}
        submitLabel="Plan visit"
        resetOnSuccess
        className="f"
        buttonClassName="btn bts"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <label>
          <span className="kl">Date</span>
          <input type="date" name="date" required />
        </label>
        <label>
          <span className="kl">Type</span>
          <select name="type" defaultValue="Previsit">
            {VISIT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="kl">Attendees</span>
          <input name="who" placeholder="Names and roles" />
        </label>
        <label>
          <span className="kl">Purpose</span>
          <input name="purpose" placeholder="What must be checked" />
        </label>
      </SubmitForm>
      <p className="sub">
        Visits save automatically. Record findings and mark each visit as done when the
        survey is complete.
      </p>
    </div>
  );
}
