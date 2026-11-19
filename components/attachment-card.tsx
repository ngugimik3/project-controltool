import { AttachmentPicker, AttachmentThumb } from "@/components/attachments";
import { ConfirmButton } from "@/components/forms";
import { deleteAttachmentAction } from "@/lib/actions/attachment";
import type { ProjectView } from "@/lib/types";

export function AttachmentCard({
  project,
  scope,
  locked,
}: {
  project: ProjectView;
  scope: string;
  locked?: boolean;
}) {
  const attachments = project.attachments.filter(
    (attachment) => attachment.checkItemId === null && attachment.scope === scope,
  );

  return (
    <div className="card">
      <div className="ct">Documents and photos</div>
      <div className="grow">
        {locked ? null : (
          <>
            <AttachmentPicker projectId={project.id} scope={scope} />
            <AttachmentPicker projectId={project.id} scope={scope} variant="photo" />
          </>
        )}
        <span className="sub">
          Files are shared with everyone who has this page: images, PDF, CSV or text, up to
          20 MB.
        </span>
      </div>
      <div className="ph">
        {attachments.length ? (
          attachments.map((attachment) => {
            return (
              <div className="at" key={attachment.id}>
                <AttachmentThumb attachment={attachment} />
                <small title={attachment.name}>{attachment.name}</small>
                <ConfirmButton
                  action={deleteAttachmentAction}
                  fields={{ projectId: project.id, attachmentId: attachment.id }}
                  label="Remove"
                  confirm="Remove this file?"
                  className="btn btd"
                />
              </div>
            );
          })
        ) : (
          <p className="sub">Nothing attached yet.</p>
        )}
      </div>
    </div>
  );
}
