import { ConfirmButton, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import {
  addUserAction,
  deleteUserAction,
  setUserActiveAction,
  setUserRoleAction,
} from "@/lib/actions/admin";
import { fmtDate } from "@/lib/planner";
import { ROLE_LABEL, ROLES } from "@/lib/roles";
import type { UserRow } from "@/lib/data";

export function UsersView({ users }: { users: UserRow[] }) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Users"
        subtitle="Create accounts, change roles, deactivate access"
      />

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
    </div>
  );
}
