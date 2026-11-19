import { ConfirmButton, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { addProjectTypeAction } from "@/lib/actions/project";
import { addTaskRoleAction } from "@/lib/actions/task";
import {
  addUserAction,
  deleteUserAction,
  importBackupAction,
  setUserActiveAction,
  setUserRoleAction,
} from "@/lib/actions/admin";
import { fmtDate } from "@/lib/planner";
import { ROLE_LABEL, ROLES } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import type { ActivityRow, UserRow } from "@/lib/data";
import type { SettingsView } from "@/lib/types";

export function AdminView({
  role,
  settings,
  users,
  activity,
}: {
  role: Role;
  settings: SettingsView;
  users: UserRow[];
  activity: ActivityRow[];
}) {
  const superadmin = role === "superadmin";

  return (
    <div className="view-stack">
      <PageHeader
        title="Admin"
        subtitle="Backup, users, categories, roles, and activity"
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
          <p className="sub">Only superadmins can import backups or manage users.</p>
        )}
      </div>

      {superadmin ? (
        <div className="card">
          <div className="ct">Users</div>
          {users.map((user) => (
            <div className="irow" key={user.id}>
              <span className="b">
                {user.name} (@{user.username ?? ""}) · last login{" "}
                {user.lastLoginAt ? fmtDate(user.lastLoginAt) : "never"}
              </span>
              <span className={`badge ${user.active ? "bg" : "br"}`}>
                {user.active ? "Active" : "Deactivated"}
              </span>
              <SubmitForm
                action={setUserRoleAction}
                submitLabel="Save role"
                buttonClassName="btn bts"
                className="grow"
              >
                <input type="hidden" name="userId" value={user.id} />
                <select name="role" defaultValue={user.role}>
                  {ROLES.map((item) => (
                    <option key={item} value={item}>
                      {ROLE_LABEL[item]}
                    </option>
                  ))}
                </select>
              </SubmitForm>
              <SubmitForm
                action={setUserActiveAction}
                submitLabel={user.active ? "Deactivate" : "Activate"}
                buttonClassName="btn bts"
                className="grow"
              >
                <input type="hidden" name="userId" value={user.id} />
                <input
                  type="hidden"
                  name="active"
                  value={user.active ? "false" : "true"}
                />
              </SubmitForm>
              <ConfirmButton
                action={deleteUserAction}
                fields={{ userId: user.id }}
                label="Delete"
                confirm={`Delete @${user.username ?? user.name}?`}
              />
            </div>
          ))}
          <SubmitForm
            action={addUserAction}
            submitLabel="Add user"
            resetOnSuccess
            className="f"
            buttonClassName="btn btp"
          >
            <input name="name" placeholder="Full name" required />
            <input name="username" placeholder="Username" required />
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              required
            />
            <select name="role" defaultValue="user">
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABEL[item]}
                </option>
              ))}
            </select>
          </SubmitForm>
        </div>
      ) : null}

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
