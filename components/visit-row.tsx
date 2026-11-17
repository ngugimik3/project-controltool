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
    <tr>
      <td>
        <AutoForm action={saveVisitAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="visitId" value={visit.id} />
          <input aria-label="Visit date" type="date" name="date" defaultValue={visit.date} />
          <select aria-label="Visit type" name="type" defaultValue={visit.type}>
            {VISIT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <input aria-label="Visit owner" name="who" defaultValue={visit.who} placeholder="Who" />
          <input
            aria-label="Visit purpose"
            name="purpose"
            defaultValue={visit.purpose}
            placeholder="Purpose"
          />
          <select aria-label="Visit status" name="status" defaultValue={visit.status}>
            {VISIT_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <input
            aria-label="Visit notes"
            name="notes"
            defaultValue={visit.notes}
            placeholder="Key findings"
          />
        </AutoForm>
      </td>
      <td>
        {canDelete ? (
          <ConfirmButton
            action={deleteVisitAction}
            fields={{ projectId, visitId: visit.id }}
            label="Del"
            confirm="Delete this visit?"
          />
        ) : null}
      </td>
    </tr>
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
          <span className="kl">Who</span>
          <input name="who" placeholder="Engineer / client" />
        </label>
        <label>
          <span className="kl">Purpose</span>
          <input name="purpose" placeholder="Purpose" />
        </label>
      </SubmitForm>
      <p className="sub">
        Findings go in the general comments below. Attach documents and photos as they arrive.
      </p>
    </div>
  );
}
