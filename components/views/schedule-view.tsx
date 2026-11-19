import Link from "next/link";
import { ActionButton, AutoForm, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { ScheduleTimeline } from "@/components/schedule-timeline";
import { TaskRow } from "@/components/task-row";
import {
  addTaskAction,
  addTaskRoleAction,
  saveGanttAction,
} from "@/lib/actions/task";
import { WBS } from "@/lib/defaults";
import {
  canDependOn,
  derivedTaskStatus,
  ganttDates,
  ganttWindow,
  sortedTasks,
} from "@/lib/planner";
import type { ProjectView, SettingsView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function ScheduleView({
  project,
  settings,
  role,
}: {
  project: ProjectView;
  settings: SettingsView;
  role: Role;
}) {
  const tasks = sortedTasks(project.tasks);
  const window = ganttWindow(project);
  const dates = ganttDates(window);
  const canDelete = role === "admin" || role === "superadmin";
  const derived = tasks.map((task) => derivedTaskStatus(task));
  const done = derived.filter((status) => status === 3).length;
  const overdue = tasks.filter(
    (task) => derivedTaskStatus(task) === 2 && task.status !== 2,
  ).length;
  const blocked = derived.filter((status) => status === 2).length;

  const roles = [
    ...new Set([
      ...WBS.map((item) => item[1]),
      ...settings.taskRoles,
      ...project.tasks.map((task) => task.role),
    ]),
  ]
    .filter(Boolean)
    .sort();

  const gantt = (project.extra.gantt ?? {}) as { from?: string; to?: string; unit?: string };

  return (
    <div className="view-stack">
      <PageHeader
        title="Schedule"
        subtitle={`${project.name} · ${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Link
              className="btn btg no-print"
              href="/print/schedule"
              target="_blank"
              rel="noreferrer"
            >
              Print layout
            </Link>
            <a className="btn btg no-print" href="/api/export/schedule" download>
              Export CSV
            </a>
          </>
        }
      />

      <datalist id="task-roles">
        {roles.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      <div className="schedule-stats">
        <div className="schedule-stat">
          <span className="schedule-stat-label">Done</span>
          <strong>
            {done}/{tasks.length}
          </strong>
        </div>
        <div className={`schedule-stat${overdue ? " warn" : ""}`}>
          <span className="schedule-stat-label">Overdue</span>
          <strong>{overdue}</strong>
        </div>
        <div className={`schedule-stat${blocked ? " blocked" : ""}`}>
          <span className="schedule-stat-label">Blocked</span>
          <strong>{blocked}</strong>
        </div>
        <div className="schedule-stat">
          <span className="schedule-stat-label">Window</span>
          <strong>
            {dates.from} → {dates.to}
          </strong>
        </div>
      </div>

      <div className="card">
        <div className="ct">Gantt period</div>
        <AutoForm action={saveGanttAction} className="f">
          <input type="hidden" name="projectId" value={project.id} />
          <label>
            <span className="kl">From (blank fits the tasks)</span>
            <input type="date" name="from" defaultValue={gantt.from ?? ""} />
          </label>
          <label>
            <span className="kl">To</span>
            <input type="date" name="to" defaultValue={gantt.to ?? ""} />
          </label>
          <label>
            <span className="kl">Scale</span>
            <select name="unit" defaultValue={window.unit}>
              <option value="day">Days</option>
              <option value="week">Weeks</option>
              <option value="month">Months</option>
            </select>
          </label>
        </AutoForm>
        <div style={{ marginTop: ".6rem" }}>
          <ActionButton
            action={saveGanttAction}
            fields={{ projectId: project.id, from: "", to: "", unit: window.unit }}
            label="Fit to tasks"
            className="btn btg"
          />
        </div>
      </div>

      <div className="card gantt-card">
        <div className="ct no-print">Timeline</div>
        <ScheduleTimeline project={project} tasks={tasks} ganttWindow={window} />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="card-inset-head">
          <div className="ct" style={{ marginBottom: 0 }}>
            Tasks
          </div>
          <p className="sub" style={{ margin: 0 }}>
            Edit details inline. The chart above updates after save.
          </p>
        </div>
        <div className="sc">
          <table className="tbl" style={{ border: 0, borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Task and dependency</th>
                <th>Role</th>
                <th>Owner</th>
                <th>Dates</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tasks.length ? (
                tasks.map((task) => {
                  const dependencies = project.tasks
                    .filter((candidate) => canDependOn(project.tasks, task.id, candidate.id))
                    .map((candidate) => ({
                      id: candidate.id,
                      name: candidate.name,
                      status: candidate.status,
                    }));
                  return (
                    <TaskRow
                      key={task.id}
                      projectId={project.id}
                      task={task}
                      dependencies={dependencies}
                      canDelete={canDelete}
                    />
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="empty">
                    No tasks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="ct">Add task</div>
        <SubmitForm
          action={addTaskAction}
          submitLabel="Add task"
          resetOnSuccess
          className="f"
          buttonClassName="btn btp"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input name="name" placeholder="Task name" required />
          <input name="role" list="task-roles" placeholder="Role" />
          <input name="owner" placeholder="Owner" />
          <label>
            <span className="kl">Start</span>
            <input type="date" name="start" required />
          </label>
          <label>
            <span className="kl">End</span>
            <input type="date" name="end" required />
          </label>
          <label>
            <span className="kl">Depends on</span>
            <select name="dependsOnId" defaultValue="0">
              <option value="0">Runs in parallel (no dependency)</option>
              {project.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  After: {task.name}
                </option>
              ))}
            </select>
          </label>
        </SubmitForm>
      </div>

      <div className="card">
        <div className="ct">Roles</div>
        <div className="grow">
          {roles.map((item) => (
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
          <input
            name="name"
            placeholder="New role, e.g. Electrician"
            style={{ maxWidth: 260 }}
          />
        </SubmitForm>
        <p className="sub">
          Roles added here appear as suggestions on every task. You can also type any role
          directly on a task.
        </p>
      </div>
    </div>
  );
}
