"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { TASK_STATUS } from "@/lib/constants";
import {
  GanttDateAxis,
  ganttAxisWidth,
} from "@/components/gantt-date-axis";
import {
  dayCovered,
  derivedTaskStatus,
  ganttDates,
  ganttDayColumns,
  ganttMonthBands,
  ganttTodayX,
  groupTasksByStage,
  statusSymbol,
  taskDays,
  taskPercent,
  type GanttDayColumn,
  type GanttWindow,
} from "@/lib/planner";
import type { TaskView } from "@/lib/types";
import { useTaskSave } from "@/components/use-task-save";

const STATUS_CLASS = ["s0", "s1", "s2", "s3"] as const;

export function TableGantt({
  tasks,
  window: ganttWin,
  variant = "screen",
  defaultExpanded = true,
  projectId,
  editable = false,
}: {
  tasks: TaskView[];
  window: GanttWindow;
  variant?: "screen" | "print";
  /** When false, groups start collapsed on screen. Print always expands. */
  defaultExpanded?: boolean;
  projectId?: string;
  editable?: boolean;
}) {
  const groups = useMemo(() => groupTasksByStage(tasks), [tasks]);
  const days = useMemo(() => ganttDayColumns(ganttWin), [ganttWin]);
  const months = useMemo(() => ganttMonthBands(days), [days]);
  const dates = ganttDates(ganttWin);
  const todayX = ganttTodayX(ganttWin);
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.stage, defaultExpanded])),
  );
  const canEdit = Boolean(editable && projectId && variant === "screen");
  const axisWidth = ganttAxisWidth(days.length, variant === "print");
  const metaColSpan = 7;

  const rootClass =
    variant === "print" ? "table-gantt table-gantt-print" : "table-gantt";

  function isOpen(stage: number) {
    if (variant === "print") return true;
    return open[stage] !== false;
  }

  return (
    <div className={rootClass}>
      <div className={`gantt-toolbar${variant === "screen" ? " no-print" : ""}`}>
        <div className="gantt-period">
          <span className="gantt-period-label">
            {variant === "print" ? "Date range" : "Table-Gantt"}
          </span>
          <strong>
            {dates.from} → {dates.to}
          </strong>
          <span className="gantt-period-unit">
            {days.length} day{days.length === 1 ? "" : "s"} · daily
          </span>
        </div>
        <div className="gantt-legend" aria-label="Status legend">
          {TASK_STATUS.map((label, index) => (
            <span key={label} className={`gantt-legend-item ${STATUS_CLASS[index]}`}>
              <span className="gantt-sym" aria-hidden>
                {statusSymbol(index)}
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {variant === "print" ? (
        <p className="gantt-print-meta">
          Each column is one calendar day. Filled cells mark days a task is active.
          Range {dates.from} → {dates.to} ({days.length} days).
        </p>
      ) : null}

      {canEdit ? (
        <p className="gantt-edit-hint no-print">
          Edit task, owner, and dates inline. Daily cells update after save.
        </p>
      ) : null}

      <div className="table-gantt-scroll">
        <table className="table-gantt-table" style={{ minWidth: axisWidth + 520 }}>
          <thead>
            <tr>
              <th className="tg-task">Task</th>
              <th className="tg-owner">Owner</th>
              <th className="tg-date">Start</th>
              <th className="tg-date">End</th>
              <th className="tg-num">Days</th>
              <th className="tg-num">%</th>
              <th className="tg-status">Status</th>
              <th className="tg-weeks" style={{ minWidth: axisWidth, width: axisWidth }}>
                <GanttDateAxis days={days} months={months} variant={variant} />
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.length ? (
              groups.map((group) => {
                const expanded = isOpen(group.stage);
                return (
                  <Fragment key={`stage-${group.stage}`}>
                    <tr className="tg-stage-row">
                      <td colSpan={metaColSpan + 1}>
                        {variant === "print" ? (
                          <div className="gantt-stage-label">
                            {group.label}
                            <span className="tg-stage-count">
                              {group.tasks.length} task
                              {group.tasks.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="gantt-stage-toggle"
                            aria-expanded={expanded}
                            onClick={() =>
                              setOpen((prev) => ({
                                ...prev,
                                [group.stage]: !expanded,
                              }))
                            }
                          >
                            <span aria-hidden>{expanded ? "▾" : "▸"}</span>
                            {group.label}
                            <span className="tg-stage-count">
                              {group.tasks.length}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                    {group.tasks.map((task) =>
                      canEdit && projectId ? (
                        <EditableTableRow
                          key={task.id}
                          projectId={projectId}
                          task={task}
                          days={days}
                          axisWidth={axisWidth}
                          todayX={todayX}
                          expanded={expanded}
                        />
                      ) : (
                        <StaticTableRow
                          key={task.id}
                          task={task}
                          days={days}
                          axisWidth={axisWidth}
                          todayX={todayX}
                          expanded={expanded}
                        />
                      ),
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={metaColSpan + 1} className="gantt-empty">
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

function StaticTableRow({
  task,
  days,
  axisWidth,
  todayX,
  expanded,
  cells,
}: {
  task: TaskView;
  days: GanttDayColumn[];
  axisWidth: number;
  todayX: number | null;
  expanded: boolean;
  cells?: {
    name: ReactNode;
    owner: ReactNode;
    start: ReactNode;
    end: ReactNode;
  };
}) {
  const status = derivedTaskStatus(task);
  const statusClass = STATUS_CLASS[status] ?? "s0";
  const daysCount = taskDays(task.startDate, task.endDate);
  const pct = taskPercent(task);

  return (
    <tr className={`tg-data-row${expanded ? "" : " is-collapsed"}`}>
      <td className="tg-task">
        {cells?.name ?? (
          <>
            <span className={`gantt-sym ${statusClass}`} aria-hidden>
              {statusSymbol(status)}
            </span>
            {task.name}
          </>
        )}
      </td>
      <td className="tg-owner">{cells?.owner ?? (task.owner || "—")}</td>
      <td className="tg-date">{cells?.start ?? task.startDate}</td>
      <td className="tg-date">{cells?.end ?? task.endDate}</td>
      <td className="tg-num">{daysCount}</td>
      <td className="tg-num">{pct}%</td>
      <td className="tg-status">
        <span className={`print-status ${statusClass}`}>
          <span className="gantt-sym" aria-hidden>
            {statusSymbol(status)}
          </span>{" "}
          {TASK_STATUS[status] ?? TASK_STATUS[0]}
        </span>
      </td>
      <td className="tg-weeks">
        <div
          className="tg-week-track tg-day-track"
          style={{ width: axisWidth, minWidth: axisWidth }}
        >
          {days.map((day) => {
            const covered = dayCovered(day.iso, task.startDate, task.endDate);
            return (
              <span
                key={day.iso}
                className={[
                  "tg-week-cell",
                  "tg-day-slot",
                  day.isWeekend ? "is-weekend" : "",
                  day.isToday ? "is-today" : "",
                  covered ? `is-covered ${statusClass}` : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  width: `${day.width}%`,
                  left: `${day.x}%`,
                }}
                title={
                  covered
                    ? `${day.iso} · active`
                    : day.iso
                }
              >
                {covered ? <i className={`tg-mini-bar ${statusClass}`} /> : null}
              </span>
            );
          })}
          {todayX != null ? (
            <span
              className="gantt-today"
              style={{ left: `${todayX * 100}%` }}
            />
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function EditableTableRow({
  projectId,
  task,
  days,
  axisWidth,
  todayX,
  expanded,
}: {
  projectId: string;
  task: TaskView;
  days: GanttDayColumn[];
  axisWidth: number;
  todayX: number | null;
  expanded: boolean;
}) {
  const { values, setValues, save, pending } = useTaskSave(projectId, task);
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
    startDate: values.start,
    endDate: values.end,
  };

  return (
    <StaticTableRow
      task={liveTask}
      days={days}
      axisWidth={axisWidth}
      todayX={todayX}
      expanded={expanded}
      cells={{
        name: (
          <span className={`tg-edit-cell${pending ? " is-pending" : ""}`}>
            <span className={`gantt-sym ${statusClass}`} aria-hidden>
              {statusSymbol(status)}
            </span>
            <input
              aria-label="Task"
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
              onBlur={(event) => save({ ...values, name: event.target.value })}
            />
          </span>
        ),
        owner: (
          <input
            aria-label="Owner"
            value={values.owner}
            placeholder="Assign"
            onChange={(event) =>
              setValues({ ...values, owner: event.target.value })
            }
            onBlur={(event) => save({ ...values, owner: event.target.value })}
          />
        ),
        start: (
          <input
            type="date"
            aria-label="Start"
            value={values.start}
            onChange={(event) => save({ ...values, start: event.target.value })}
          />
        ),
        end: (
          <input
            type="date"
            aria-label="End"
            value={values.end}
            onChange={(event) => save({ ...values, end: event.target.value })}
          />
        ),
      }}
    />
  );
}
