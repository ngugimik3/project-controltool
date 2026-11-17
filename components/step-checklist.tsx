import Link from "next/link";
import { AttachmentCard } from "@/components/attachment-card";
import { AttachmentStrip } from "@/components/attachments";
import { AutoForm, ConfirmButton, SubmitForm } from "@/components/forms";
import { ReviewForm, ReviewList } from "@/components/reviews";
import { StepStatus } from "@/components/step-status";
import {
  addCheckItemAction,
  deleteCheckItemAction,
  updateCheckItemAction,
} from "@/lib/actions/checklist";
import { checkLabel, isCheckOk } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function StepChecklist({
  project,
  kind,
  role,
}: {
  project: ProjectView;
  kind: "install" | "commis";
  role: Role;
}) {
  const items = project.checkItems.filter((item) => item.kind === kind);
  const ok = items.filter((item) => isCheckOk(item)).length;
  const reviews = project.stageReviews.filter((review) => review.key === kind);
  const canDelete = role === "admin" || role === "superadmin";
  const label = checkLabel(kind);

  return (
    <>
      <div className="ct" style={{ marginTop: ".6rem" }}>
        {label}: {ok} of {items.length} steps done
      </div>
      <p className="sub" style={{ marginBottom: 8 }}>
        Every step must be Done to pass this stage gate.
      </p>
      <div className="sc">
        <table className="tbl">
          <thead>
            <tr>
              <th>Step</th>
              <th>Status</th>
              <th style={{ minWidth: 260 }}>Reviews and status updates</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <AutoForm action={updateCheckItemAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="field" value="item" />
                      <input aria-label="Step" name="value" defaultValue={item.item} />
                    </AutoForm>
                  </td>
                  <td>
                    <StepStatus projectId={project.id} itemId={item.id} status={item.status} />
                  </td>
                  <td>
                    <details>
                      <summary>
                        {item.reviews.length} review(s)
                        {item.reviews.length
                          ? `, latest v${
                              item.reviews[item.reviews.length - 1].version
                            }: ${item.reviews[item.reviews.length - 1].text.slice(0, 40)}`
                          : ""}
                      </summary>
                      <ReviewList reviews={item.reviews} />
                      <ReviewForm projectId={project.id} itemId={item.id} />
                    </details>
                    <AttachmentStrip
                      attachments={item.attachments}
                      projectId={project.id}
                      scope={item.kind}
                      itemId={item.id}
                      canDelete={canDelete}
                    />
                  </td>
                  <td>
                    {canDelete ? (
                      <ConfirmButton
                        action={deleteCheckItemAction}
                        fields={{ projectId: project.id, itemId: item.id }}
                        label="Del"
                        confirm="Delete this step?"
                      />
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty">
                  No steps yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grow">
        <SubmitForm
          action={addCheckItemAction}
          submitLabel="Add step"
          resetOnSuccess
          className="grow"
          buttonClassName="btn btp"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="kind" value={kind} />
          <input name="item" placeholder="Add a new step" style={{ maxWidth: 340 }} />
        </SubmitForm>
        <Link
          className="btn btg"
          href={`/print/steps?kind=${kind}`}
          target="_blank"
          rel="noreferrer"
        >
          Print {label}
        </Link>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="ct">Stage reviews and status updates</div>
        <ReviewList reviews={reviews} />
        <ReviewForm projectId={project.id} keyName={kind} />
      </div>

      <AttachmentCard project={project} scope={kind} canDelete={canDelete} />
    </>
  );
}
