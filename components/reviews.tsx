import { SubmitForm } from "@/components/forms";
import { addCheckReviewAction, addStageReviewAction } from "@/lib/actions/checklist";
import { fmtDate } from "@/lib/planner";
import { TASK_STATUS } from "@/lib/constants";
import type { ReviewView } from "@/lib/types";

function badge(status: string) {
  if (status === "Done") return "bg";
  if (status === "Blocked") return "br";
  return "ba";
}

export function ReviewList({ reviews }: { reviews: ReviewView[] }) {
  if (!reviews.length) return <p className="sub">No reviews yet.</p>;
  return (
    <div style={{ marginBottom: ".8rem" }}>
      {[...reviews]
        .sort((a, b) => b.version - a.version)
        .map((review) => (
          <div key={review.id} className="irow" style={{ alignItems: "flex-start" }}>
            <span className="badge bn">v{review.version}</span>
            <span className={`badge ${badge(review.status)}`}>{review.status}</span>
            <div>
              <div className="sub">
                {fmtDate(review.date)} · {review.author}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{review.text}</div>
            </div>
          </div>
        ))}
    </div>
  );
}

export function ReviewForm({
  projectId,
  keyName,
  itemId,
}: {
  projectId: string;
  keyName?: "survey" | "install" | "commis";
  itemId?: string;
}) {
  return (
    <SubmitForm
      action={keyName ? addStageReviewAction : addCheckReviewAction}
      submitLabel="Add review"
      className="f"
      resetOnSuccess
      buttonClassName="btn bts"
    >
      <input type="hidden" name="projectId" value={projectId} />
      {keyName ? <input type="hidden" name="key" value={keyName} /> : null}
      {itemId ? <input type="hidden" name="itemId" value={itemId} /> : null}
      <select name="status" aria-label="Review status" defaultValue="In progress">
        {TASK_STATUS.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <textarea
        name="text"
        rows={2}
        placeholder="Review or status update.."
        style={{ gridColumn: "1 / -1" }}
      />
    </SubmitForm>
  );
}
