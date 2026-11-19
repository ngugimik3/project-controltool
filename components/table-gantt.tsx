"use client";

import { Fragment, useMemo, useState } from "react";
import { TASK_STATUS } from "@/lib/constants";
import {
  derivedTaskStatus,
  ganttDates,
  ganttTodayX,
  ganttWeekColumns,
  groupTasksByStage,
  statusSymbol,
  taskDays,
  taskPercent,
  weekCoverage,
  type GanttWindow,
} from "@/lib/planner";
import type { TaskView } from "@/lib/types";

const STATUS_CLASS = ["s0", "s1", "s2", "s3"] as const;

export function TableGantt({
  tasks,
  window: ganttWin,
  variant = "screen",
  defaultExpanded = true,
}: {
  tasks: TaskView[];
  window: GanttWindow;
  variant?: "screen" | "print";
  /** When false, groups start collapsed on screen. Print always expands. */
  defaultExpanded?: boolean;
}) {
  const groups = useMemo(() => groupTasksByStage(tasks), [tasks]);
  const weeks = useMemo(() => ganttWeekColumns(ganttWin), [ganttWin]);
  const dates = ganttDates(ganttWin);
  const todayX = ganttTodayX(ganttWin);
  const [open, setOpen] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.stage, defaultExpanded])),
  );

  const rootClass =
    variant === "print" ? "table-gantt table-gantt-print" : "table-gantt";

  function isOpen(stage: number) {
    if (variant === "print") return true;
    return open[stage] !== false;
  }

  return (
    <div className={rootClass}>
      {variant === "screen" ? (
        <div className="gantt-toolbar no-print">
          <div className="gantt-period">
            <span className="gantt-period-label">Table-Gantt</span>
            <strong>
              {dates.from} → {dates.to}
            </strong>
            <span className="gantt-period-unit">weekly</span>
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
      ) : null}

      <div className="table-gantt-scroll">
        <table className="table-gantt-table">
          <thead>
            <tr>
              <th className="tg-task">Task</th>
              <th className="tg-owner">Owner</th>
              <th className="tg-date">Start</th>
              <th className="tg-date">End</th>
              <th className="tg-num">Days</th>
              <th className="tg-num">%</th>
              <th className="tg-status">Status</th>
              <th className="tg-weeks">
                <div className="tg-week-head">
                  {weeks.map((week) => (
                    <span
                      key={week.start}
                      className="tg-week-label"
                      style={{ width: `${week.width}%`, left: `${week.x}%` }}
                    >
                      {week.label}
                    </span>
                  ))}
                  {todayX != null ? (
                    <span className="gantt-today-head" style={{ left: `${todayX * 100}%` }} />
                  ) : null}
                </div>
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
                      <td colSpan={8}>
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
                    {group.tasks.map((task) => {
                      const status = derivedTaskStatus(task);
                      const statusClass = STATUS_CLASS[status] ?? "s0";
                      const days = taskDays(task.startDate, task.endDate);
                      const pct = taskPercent(task);
                      return (
                        <tr
                          key={task.id}
                          className={`tg-data-row${expanded ? "" : " is-collapsed"}`}
                        >
                          <td className="tg-task">
                            <span className={`gantt-sym ${statusClass}`} aria-hidden>
                              {statusSymbol(status)}
                            </span>
                            {task.name}
                          </td>
                          <td className="tg-owner">{task.owner || "—"}</td>
                          <td className="tg-date">{task.startDate}</td>
                          <td className="tg-date">{task.endDate}</td>
                          <td className="tg-num">{days}</td>
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
                            <div className="tg-week-track">
                              {weeks.map((week) => {
                                const cover = weekCoverage(
                                  week.start,
                                  week.end,
                                  task.startDate,
                                  task.endDate,
                                );
                                return (
                                  <span
                                    key={week.start}
                                    className="tg-week-cell"
                                    style={{
                                      width: `${week.width}%`,
                                      left: `${week.x}%`,
                                    }}
                                  >
                                    {cover > 0 ? (
                                      <i
                                        className={`tg-mini-bar ${statusClass}`}
                                        style={{
                                          width: `${Math.max(12, cover * 100)}%`,
                                        }}
                                      />
                                    ) : null}
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
                    })}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="gantt-empty">
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
