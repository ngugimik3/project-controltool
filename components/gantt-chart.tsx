"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { TASK_STATUS } from "@/lib/constants";
import {
  GanttDateAxis,
  ganttAxisWidth,
} from "@/components/gantt-date-axis";
import {
  derivedTaskStatus,
  ganttBar,
  ganttDates,
  ganttDayColumns,
  ganttMonthBands,
  ganttTodayX,
  groupTasksByStage,
  statusSymbol,
  type GanttDayColumn,
  type GanttWindow,
} from "@/lib/planner";
import type { TaskView } from "@/lib/types";
import { useTaskSave } from "@/components/use-task-save";

const STATUS_CLASS = ["s0", "s1", "s2", "s3"] as const;

export function GanttChart({
  tasks,
  window: ganttWin,
  variant = "screen",
  showLegend = true,
  groupByStage = false,
  projectId,
  editable = false,
}: {
  tasks: TaskView[];
  window: GanttWindow;
  variant?: "screen" | "print";
  showLegend?: boolean;
  groupByStage?: boolean;
  projectId?: string;
  editable?: boolean;
}) {
  const days = useMemo(() => ganttDayColumns(ganttWin), [ganttWin]);
  const months = useMemo(() => ganttMonthBands(days), [days]);
  const dates = ganttDates(ganttWin);
  const todayX = ganttTodayX(ganttWin);
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const groups = groupByStage
    ? groupTasksByStage(tasks)
    : [{ stage: -1, label: "", tasks }];
  const canEdit = Boolean(editable && projectId && variant === "screen");
  const axisWidth = ganttAxisWidth(days.length, variant === "print");
  const rootClass =
    variant === "print" ? "gantt gantt-print" : "gantt gantt-screen";

  return (
    <div className={rootClass}>
      <div className={`gantt-toolbar${variant === "screen" ? " no-print" : ""}`}>
        <div className="gantt-period">
          <span className="gantt-period-label">
            {variant === "print" ? "Date range" : "Timeline"}
          </span>
          <strong>
            {dates.from} → {dates.to}
          </strong>
          <span className="gantt-period-unit">
            {days.length} day{days.length === 1 ? "" : "s"} · daily
          </span>
        </div>
        {showLegend ? <GanttLegend today={todayX != null} /> : null}
      </div>

      {variant === "print" ? (
        <p className="gantt-print-meta">
          Each column is one calendar day. Bars show task span and status.
          Range {dates.from} → {dates.to} ({days.length} days).
        </p>
      ) : null}

      {canEdit ? (
        <p className="gantt-edit-hint no-print">
          Click a task to edit name, owner, and dates on the chart.
        </p>
      ) : null}

      <div className="gantt-scroll">
        <table className="gantt-table" style={{ minWidth: axisWidth + 220 }}>
          <thead>
            <tr>
              <th className="gantt-th-task" rowSpan={1}>
                Task
              </th>
              <th className="gantt-th-chart">
                <GanttDateAxis days={days} months={months} variant={variant} />
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length ? (
              groups.map((group) => (
                <Fragment key={`stage-${group.stage}`}>
                  {group.label ? (
                    <tr className="gantt-stage-row">
                      <td colSpan={2}>
                        <div className="gantt-stage-label">{group.label}</div>
                      </td>
                    </tr>
                  ) : null}
                  {group.tasks.map((task) => {
                    const dependency = task.dependsOnId
                      ? byId.get(task.dependsOnId)
                      : undefined;
                    if (canEdit && projectId) {
                      return (
                        <EditableGanttRow
                          key={task.id}
                          projectId={projectId}
                          task={task}
                          ganttWin={ganttWin}
                          days={days}
                          axisWidth={axisWidth}
                          todayX={todayX}
                          dependencyName={dependency?.name}
                        />
                      );
                    }
                    return (
                      <GanttRow
                        key={task.id}
                        task={task}
                        ganttWin={ganttWin}
                        days={days}
                        axisWidth={axisWidth}
                        todayX={todayX}
                        dependencyName={dependency?.name}
                      />
                    );
                  })}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="gantt-empty">
                  No tasks to chart yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GanttRow({
  task,
  ganttWin,
  days,
  axisWidth,
  todayX,
  dependencyName,
  label,
}: {
  task: TaskView;
  ganttWin: GanttWindow;
  days: GanttDayColumn[];
  axisWidth: number;
  todayX: number | null;
  dependencyName?: string;
  label?: ReactNode;
}) {
  const bar = ganttBar(ganttWin, task.startDate, task.endDate);
  const status = derivedTaskStatus(task);
  const statusClass = STATUS_CLASS[status] ?? "s0";

  return (
    <tr className="gantt-data-row">
      <td className="gantt-label">
        {label ?? (
          <>
            <div className="gantt-label-name">
              <span className={`gantt-sym ${statusClass}`} aria-hidden>
                {statusSymbol(status)}
              </span>
              {task.name}
            </div>
            <div className="gantt-label-meta">
              {[
                task.owner || task.role,
                dependencyName ? `after ${dependencyName}` : null,
                `${task.startDate} → ${task.endDate}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </>
        )}
      </td>
      <td className="gantt-track-cell">
        <div className="gantt-track" style={{ width: axisWidth, minWidth: axisWidth }}>
          {days.map((day) => (
            <div
              key={`grid-${task.id}-${day.iso}`}
              className={[
                "gantt-vline",
                day.isWeekend ? "is-weekend" : "",
                day.isToday ? "is-today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${day.x}%` }}
            />
          ))}
          {todayX != null ? (
            <div
              className="gantt-today"
              style={{ left: `${todayX * 100}%` }}
            />
          ) : null}
          {bar.width > 0 ? (
            <div
              className={`gantt-bar-wrap ${statusClass}`}
              style={{
                left: `${bar.left}%`,
                width: `${Math.max(1.2, bar.width)}%`,
              }}
            >
              <div
                className={`gantt-bar ${statusClass}`}
                title={`${task.name}: ${task.startDate} → ${task.endDate}`}
              />
              <span className="gantt-bar-caption">
                <span className="gantt-sym" aria-hidden>
                  {statusSymbol(status)}
                </span>
                {TASK_STATUS[status] ?? TASK_STATUS[0]}
                <span className="gantt-bar-dates">
                  {task.startDate} → {task.endDate}
                </span>
              </span>
            </div>
          ) : (
            <div className="gantt-bar-empty">Outside period</div>
          )}
        </div>
      </td>
    </tr>
  );
}

function EditableGanttRow({
  projectId,
  task,
  ganttWin,
  days,
  axisWidth,
  todayX,
  dependencyName,
}: {
  projectId: string;
  task: TaskView;
  ganttWin: GanttWindow;
  days: GanttDayColumn[];
  axisWidth: number;
  todayX: number | null;
  dependencyName?: string;
}) {
  const { values, setValues, save, pending } = useTaskSave(projectId, task);
  const [open, setOpen] = useState(false);
  const status = derivedTaskStatus({
    ...task,
    startDate: values.start,
    endDate: values.end,
  });
  const statusClass = STATUS_CLASS[status] ?? "s0";
  const liveTask: TaskView = {
    ...task,
    name: values.name,
    owner: values.owner,
    role: values.role,
    startDate: values.start,
    endDate: values.end,
  };

  return (
    <GanttRow
      task={liveTask}
      ganttWin={ganttWin}
      days={days}
      axisWidth={axisWidth}
      todayX={todayX}
      dependencyName={dependencyName}
      label={
        <div className={`gantt-edit${open ? " is-open" : ""}${pending ? " is-pending" : ""}`}>
          <button
            type="button"
            className="gantt-edit-toggle"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className={`gantt-sym ${statusClass}`} aria-hidden>
              {statusSymbol(status)}
            </span>
            <span className="gantt-label-name">{values.name || "Untitled task"}</span>
            <span className="gantt-edit-chevron" aria-hidden>
              {open ? "▾" : "▸"}
            </span>
          </button>
          <div className="gantt-label-meta">
            {[
              values.owner || values.role,
              dependencyName ? `after ${dependencyName}` : null,
              `${values.start} → ${values.end}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
          {open ? (
            <div className="gantt-edit-fields">
              <label>
                <span className="kl">Task</span>
                <input
                  value={values.name}
                  onChange={(event) =>
                    setValues({ ...values, name: event.target.value })
                  }
                  onBlur={(event) =>
                    save({ ...values, name: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="kl">Owner</span>
                <input
                  value={values.owner}
                  placeholder="Assign person"
                  onChange={(event) =>
                    setValues({ ...values, owner: event.target.value })
                  }
                  onBlur={(event) =>
                    save({ ...values, owner: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="kl">Role</span>
                <input
                  list="task-roles"
                  value={values.role}
                  onChange={(event) =>
                    setValues({ ...values, role: event.target.value })
                  }
                  onBlur={(event) =>
                    save({ ...values, role: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="kl">Start</span>
                <input
                  type="date"
                  value={values.start}
                  onChange={(event) =>
                    save({ ...values, start: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="kl">End</span>
                <input
                  type="date"
                  value={values.end}
                  onChange={(event) =>
                    save({ ...values, end: event.target.value })
                  }
                />
              </label>
            </div>
          ) : null}
        </div>
      }
    />
  );
}

function GanttLegend({ today }: { today: boolean }) {
  return (
    <div className="gantt-legend" aria-label="Status legend">
      {TASK_STATUS.map((label, index) => (
        <span key={label} className={`gantt-legend-item ${STATUS_CLASS[index]}`}>
          <i />
          <span className="gantt-sym" aria-hidden>
            {statusSymbol(index)}
          </span>
          {label}
        </span>
      ))}
      {today ? (
        <span className="gantt-legend-item today">
          <i />
          Today
        </span>
      ) : null}
    </div>
  );
}
