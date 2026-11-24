import { SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { addProjectTypeAction } from "@/lib/actions/project";
import { addTaskRoleAction } from "@/lib/actions/task";
import { importBackupAction } from "@/lib/actions/admin";
import { fmtDate } from "@/lib/planner";
import type { Role } from "@/lib/roles";
import type { ActivityRow } from "@/lib/data";
import type { SettingsView as SettingsData } from "@/lib/types";

export function SettingsView({
  role,
  settings,
  activity,
}: {
  role: Role;
  settings: SettingsData;
  activity: ActivityRow[];
}) {
  const superadmin = role === "superadmin";

  return (
    <div className="view-stack">
      <PageHeader
        title="Settings"
        subtitle="Backup, categories, roles, and activity"
      />

      <div className="card">
        <div className="ct">Backup</div>
        <div className="grow">
          <a className="btn btp" href="/api/backup" download>
            Download backup
          </a>
          <span className="sub">
            JSON snapshot of projects, checklists, reviews, costs and attachments.
          </span>
        </div>
        {superadmin ? (
          <SubmitForm
            action={importBackupAction}
            submitLabel="Import and replace all projects"
            className="f"
            buttonClassName="btn btd"
          >
            <p className="warn" style={{ gridColumn: "1 / -1" }}>
              Importing replaces every project and attachment in the database. Download a
              backup first.
            </p>
            <textarea
              name="backup"
              rows={6}
              placeholder="Paste a backup JSON file here"
              style={{ gridColumn: "1 / -1" }}
              required
            />
            <input
              name="confirm"
              placeholder="Type REPLACE to confirm"
              style={{ maxWidth: 280 }}
              required
            />
          </SubmitForm>
        ) : (
          <p className="sub">Only superadmins can import backups.</p>
        )}
      </div>

      <div className="card">
        <div className="ct">Project categories</div>
        <div className="grow">
          {settings.projectTypes.map((item) => (
            <span className="badge bn" key={item}>
              {item}
            </span>
          ))}
        </div>
        <SubmitForm
          action={addProjectTypeAction}
          submitLabel="Add category"
          resetOnSuccess
          className="grow"
          buttonClassName="btn btg"
        >
          <input
            name="name"
            placeholder="New category, e.g. Solar PV system"
            style={{ maxWidth: 320 }}
          />
        </SubmitForm>
      </div>

      <div className="card">
        <div className="ct">Task roles</div>
        <div className="grow">
          {settings.taskRoles.map((item) => (
            <span className="badge bn" key={item}>
              {item}
            </span>
          ))}
        </div>
        <SubmitForm
          action={addTaskRoleAction}
          submitLabel="Add role"
          resetOnSuccess
          className="grow"
          buttonClassName="btn btg"
        >
          <input name="name" placeholder="New role, e.g. Electrician" style={{ maxWidth: 320 }} />
        </SubmitForm>
      </div>

      <div className="card">
        <div className="ct">Activity log</div>
        <div className="sc">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activity.length ? (
                activity.map((entry) => (
                  <tr key={entry.id}>
                    <td>{fmtDate(entry.ts)}</td>
                    <td>{entry.userName}</td>
                    <td>{entry.action}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="empty">
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
