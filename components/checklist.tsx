import Link from "next/link";
import { AutoForm, SubmitForm } from "@/components/forms";
import { CheckRow } from "@/components/check-row";
import { AttachmentCard } from "@/components/attachment-card";
import { addCheckItemAction, setNoteAction } from "@/lib/actions/checklist";
import { checkLabel, isCheckOk } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function Checklist({
  project,
  kind,
  role,
  hideAttachments,
}: {
  project: ProjectView;
  kind: string;
  role: Role;
  hideAttachments?: boolean;
}) {
  const items = project.checkItems.filter((item) => item.kind === kind);
  const ok = items.filter((item) => isCheckOk(item)).length;
  const note = project.notes.find((entry) => entry.key === kind)?.text ?? "";
  const locked = kind === "sat" && Boolean(project.signedBy);
  const canDelete = role === "admin" || role === "superadmin";
  const label = checkLabel(kind);

  return (
    <>
    <div className="card">
      <div className="ct">
        {label} checklist: {ok} of {items.length} complete
      </div>
      <div className="sc">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: "28%" }}>Item</th>
              <th style={{ width: "22%" }}>Reading / detail</th>
              <th style={{ width: "18%" }}>Result</th>
              <th style={{ width: "24%" }}>Comment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <CheckRow
                  key={item.id}
                  projectId={project.id}
                  item={item}
                  canDelete={canDelete}
                  locked={locked}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="empty">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {locked ? (
        <p className="sub" style={{ marginTop: 8 }}>
          SAT is signed off and locked.
        </p>
      ) : (
        <SubmitForm
          action={addCheckItemAction}
          submitLabel="Add"
          className="grow"
          resetOnSuccess
          buttonClassName="btn bts"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="kind" value={kind} />
          <input name="item" placeholder="Add an item" style={{ flex: 1, minWidth: 220 }} />
        </SubmitForm>
      )}
      <div className="grow" style={{ marginTop: 8 }}>
        <Link
          className="btn btg"
          href={`/print/checklist?kind=${kind}`}
          target="_blank"
          rel="noreferrer"
        >
          Print {label}
        </Link>
      </div>
      <div style={{ marginTop: ".8rem" }}>
        <div className="kl">General {label.toLowerCase()} comments</div>
        <AutoForm action={setNoteAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="key" value={kind} />
          <textarea name="text" defaultValue={note} rows={3} placeholder="Notes.." />
        </AutoForm>
      </div>
    </div>
    {hideAttachments ? null : (
      <AttachmentCard
        project={project}
        scope={kind}
        canDelete={canDelete}
        locked={locked}
      />
    )}
    </>
  );
}
