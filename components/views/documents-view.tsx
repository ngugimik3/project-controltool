import Link from "next/link";
import { AttachmentThumb } from "@/components/attachments";
import { ConfirmButton } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { deleteAttachmentAction } from "@/lib/actions/attachment";
import { CHECK_LABELS } from "@/lib/defaults";
import { handoverReadiness } from "@/lib/handover";
import type { AttachmentMeta, ProjectView } from "@/lib/types";

function scopeLabel(scope: string): string {
  return CHECK_LABELS[scope] ?? (scope === "support" ? "Support" : scope);
}

export function DocumentsView({ project }: { project: ProjectView }) {
  const readiness = handoverReadiness(project);
  const groups = new Map<string, AttachmentMeta[]>();
  for (const attachment of project.attachments) {
    const key = attachment.scope;
    groups.set(key, [...(groups.get(key) ?? []), attachment]);
  }

  return (
    <div className="view-stack">
      <PageHeader
        title="Documents"
        subtitle={`${project.name} · handover pack and uploaded files`}
        actions={
          <Link className="btn btg" href={`/projects/${project.id}/handover`}>
            Handover pack
          </Link>
        }
      />

      <div className="card">
        <div className="ct">Handover documents</div>
        <p className="sub">
          {readiness.ready} of {readiness.total} handover slots ready
          {readiness.satSigned ? " · SAT signed off" : " · SAT sign-off pending"}.
        </p>
        <div className="grow">
          {project.docs.length ? (
            project.docs.map((doc) => (
              <span key={doc.id} className={`badge ${doc.ready ? "bg" : "bn"}`}>
                {doc.slot}
                {doc.ref ? ` · ${doc.ref}` : ""}
              </span>
            ))
          ) : (
            <span className="sub">No handover documents yet.</span>
          )}
        </div>
      </div>

      {groups.size ? (
        [...groups.entries()].map(([scope, attachments]) => (
          <div className="card" key={scope}>
            <div className="ct">{scopeLabel(scope)}</div>
            <div className="ph">
              {attachments.map((attachment) => (
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
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card">
          <div className="ct">Uploaded files</div>
          <p className="sub">
            Files uploaded from checklists, SAT, support, or handover appear here.
          </p>
        </div>
      )}
    </div>
  );
}
