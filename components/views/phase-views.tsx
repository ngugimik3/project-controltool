import { AttachmentCard } from "@/components/attachment-card";
import { Checklist } from "@/components/checklist";
import { SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { StepChecklist } from "@/components/step-checklist";
import { signOffAction } from "@/lib/actions/checklist";
import { fmtDate } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function InstallView({
  project,
  role,
}: {
  project: ProjectView;
  role: Role;
}) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Installation"
        subtitle={`${project.name} · site installation steps`}
      />
      <StepChecklist project={project} kind="install" role={role} />
    </div>
  );
}

export function CommissioningView({
  project,
  role,
}: {
  project: ProjectView;
  role: Role;
}) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Commissioning"
        subtitle={`${project.name} · bring-up and verification`}
      />
      <StepChecklist project={project} kind="commis" role={role} />
    </div>
  );
}

export function SatView({
  project,
  role,
}: {
  project: ProjectView;
  role: Role;
}) {
  return (
    <div className="view-stack">
      <PageHeader
        title="SAT"
        subtitle={`${project.name} · site acceptance and client sign-off`}
      />
      <Checklist project={project} kind="sat" role={role} hideAttachments />
      <div className="card">
        <div className="ct">Client sign-off</div>
        {project.signedBy ? (
          <p>
            Signed by {project.signedBy} on {fmtDate(project.signedAt)}. This
            record is locked.
          </p>
        ) : (
          <SubmitForm
            action={signOffAction}
            submitLabel="Record sign-off"
            className="f"
            buttonClassName="btn btp"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input
              name="name"
              placeholder="Client representative and role"
              required
            />
          </SubmitForm>
        )}
      </div>
      <AttachmentCard
        project={project}
        scope="sat"
        locked={Boolean(project.signedBy)}
      />
    </div>
  );
}

export function TrainingView({
  project,
  role,
}: {
  project: ProjectView;
  role: Role;
}) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Training"
        subtitle={`${project.name} · operator and maintainer training`}
      />
      <Checklist project={project} kind="training" role={role} />
    </div>
  );
}

export function SupportView({
  project,
  role,
}: {
  project: ProjectView;
  role: Role;
}) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Support"
        subtitle={`${project.name} · tools, parts, and warranty closeout`}
      />
      {["tools", "parts", "warranty"].map((kind) => (
        <Checklist
          key={kind}
          project={project}
          kind={kind}
          role={role}
          hideAttachments
        />
      ))}
      <AttachmentCard project={project} scope="support" />
    </div>
  );
}
