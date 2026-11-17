import Link from "next/link";
import { ActionButton, AutoForm, SubmitForm } from "@/components/forms";
import { TaskRow } from "@/components/task-row";
import {
  addTaskAction,
  addTaskRoleAction,
  saveGanttAction,
} from "@/lib/actions/task";
import { WBS } from "@/lib/defaults";
import {
  canDependOn,
  ganttDates,
  ganttTicks,
  ganttWindow,
  sortedTasks,
} from "@/lib/planner";
import type { ProjectView, SettingsView } from "@/lib/types";
import type { Role } from "@/lib/roles";
import {
  LuCalendar as Calendar,
  LuDownload as Download,
  LuPlus as Plus,
  LuPrinter as Printer,
  LuSettings2 as Settings2,
  LuUsers as Users,
} from "react-icons/lu";
import { buttonClass } from "@/lib/ui";

const DAY = 86_400_000;

function time(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

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
  const ticks = ganttTicks(window);
  const span = window.end - window.start;
  const dates = ganttDates(window);
  const canDelete = role === "admin" || role === "superadmin";

  const roles = [
    ...new Set([
      ...WBS.map((item) => item[1]),
      ...settings.taskRoles,
      ...project.tasks.map((task) => task.role),
    ]),
  ]
    .filter(Boolean)
    .sort();

  const gantt = (project.extra.gantt ?? {}) as {
    from?: string;
    to?: string;
    unit?: string;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6 px-4 sm:px-6">
      <datalist id="task-roles">
        {roles.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>

      {/* Top Controls Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Calendar className="size-4 text-brand" />
            Schedule
          </div>
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <AutoForm
            action={saveGanttAction}
            className="flex flex-wrap items-center gap-3 text-sm"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <label className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                From
              </span>
              <input
                type="date"
                name="from"
                defaultValue={gantt.from ?? ""}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                To
              </span>
              <input
                type="date"
                name="to"
                defaultValue={gantt.to ?? ""}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">
                View
              </span>
              <select
                name="unit"
                defaultValue={window.unit}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="day">Days</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
              </select>
            </label>
          </AutoForm>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            action={saveGanttAction}
            fields={{
              projectId: project.id,
              from: "",
              to: "",
              unit: window.unit,
            }}
            label="Fit to tasks"
            className={buttonClass("secondary")}
          />
          <Link
            className={buttonClass("secondary")}
            href="/print/schedule"
            target="_blank"
            rel="noreferrer"
          >
            <Printer className="size-4" />
            Print
          </Link>
          <a
            className={buttonClass("secondary")}
            href="/api/export/schedule"
            download
          >
            <Download className="size-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="text-xs text-slate-500 px-1">
        Showing timeline from{" "}
        <strong className="text-slate-700">{dates.from}</strong> to{" "}
        <strong className="text-slate-700">{dates.to}</strong>.
      </div>

      {/* Modern Gantt Chart Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-semibold w-[300px]">Task</th>
                <th className="px-4 py-3 font-semibold w-32">Role / Owner</th>
                <th className="px-4 py-3 font-semibold w-48">Dates</th>
                <th className="px-4 py-3 font-semibold w-24">Status</th>
                <th
                  className="px-4 py-3 font-semibold relative overflow-hidden"
                  style={{ minWidth: 300 }}
                >
                  {/* Gantt Timeline Header */}
                  <div className="relative h-4 w-full">
                    {ticks.map((tick) => (
                      <span
                        key={`${tick.x}-${tick.label}`}
                        className="absolute top-0 text-[11px] font-semibold text-slate-400 translate-x-[-50%] whitespace-nowrap"
                        style={{ left: `${tick.x * 100}%` }}
                      >
                        {tick.label}
                      </span>
                    ))}
                  </div>
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length ? (
                tasks.map((task) => {
                  const left = Math.max(time(task.startDate), window.start);
                  const right = Math.min(time(task.endDate) + DAY, window.end);

                  // Calculate percentages for the CSS Grid Gantt Bar
                  const barLeft = ((left - window.start) / span) * 100;
                  const barWidth =
                    right > left ? ((right - left) / span) * 100 : 0;

                  const dependencies = project.tasks
                    .filter((candidate) =>
                      canDependOn(project.tasks, task.id, candidate.id),
                    )
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
                      bar={{ left: barLeft, width: barWidth }}
                    />
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="size-8 text-slate-300" />
                      <p>
                        No tasks scheduled yet. Add one below to start building
                        your Gantt chart.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Add Task Form */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center gap-2">
            <Plus className="size-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900">
              Add New Task
            </h3>
          </div>
          <div className="p-5 flex-1">
            <SubmitForm
              action={addTaskAction}
              submitLabel="Add task"
              resetOnSuccess
              className="flex flex-col gap-4"
              buttonClassName={buttonClass("primary") + " w-full mt-2"}
            >
              <input type="hidden" name="projectId" value={project.id} />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Task Name
                </label>
                <input
                  name="name"
                  placeholder="e.g. Site survey"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Role
                  </label>
                  <input
                    name="role"
                    list="task-roles"
                    placeholder="e.g. Engineer"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Owner
                  </label>
                  <input
                    name="owner"
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Dependency
                </label>
                <select
                  name="dependsOnId"
                  defaultValue="0"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="0">Runs in parallel (no dependency)</option>
                  {project.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      After: {task.name}
                    </option>
                  ))}
                </select>
              </div>
            </SubmitForm>
          </div>
        </div>

        {/* Roles Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center gap-2">
            <Users className="size-4 text-brand" />
            <h3 className="text-sm font-semibold text-slate-900">Task Roles</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-6">
              {roles.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-auto border-t border-slate-100 pt-5">
              <SubmitForm
                action={addTaskRoleAction}
                submitLabel="Add role"
                resetOnSuccess
                className="flex items-center gap-2"
                buttonClassName={buttonClass("secondary")}
              >
                <input
                  name="name"
                  placeholder="New role, e.g. Electrician"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </SubmitForm>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Roles added here appear as suggestions on every task dropdown.
                You can also type any role directly into a task.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
