import { Fragment } from "react";
import { TASK_STATUS } from "@/lib/constants";
import {
  derivedTaskStatus,
  ganttBar,
  ganttDates,
  ganttTicks,
  ganttTodayX,
  groupTasksByStage,
  statusSymbol,
  type GanttWindow,
} from "@/lib/planner";
import type { TaskView } from "@/lib/types";

const STATUS_CLASS = ["s0", "s1", "s2", "s3"] as const;

export function GanttChart({
  tasks,
  window: ganttWin,
  variant = "screen",
  showLegend = true,
  groupByStage = false,
}: {
  tasks: TaskView[];
  window: GanttWindow;
  variant?: "screen" | "print";
  showLegend?: boolean;
  groupByStage?: boolean;
}) {
  const ticks = ganttTicks(ganttWin);
  const dates = ganttDates(ganttWin);
  const todayX = ganttTodayX(ganttWin);
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const groups = groupByStage
    ? groupTasksByStage(tasks)
    : [{ stage: -1, label: "", tasks }];
  const rootClass =
    variant === "print" ? "gantt gantt-print" : "gantt gantt-screen";

  return (
    <div className={rootClass}>
      {variant === "screen" ? (
        <div className="gantt-toolbar no-print">
          <div className="gantt-period">
            <span className="gantt-period-label">Timeline</span>
            <strong>
              {dates.from} → {dates.to}
            </strong>
            <span className="gantt-period-unit">{ganttWin.unit}s</span>
          </div>
          {showLegend ? <GanttLegend today={todayX != null} /> : null}
        </div>
      ) : showLegend ? (
        <div className="gantt-toolbar">
          <GanttLegend today={todayX != null} />
        </div>
      ) : null}

      <div className="gantt-scroll">
        <table className="gantt-table">
          <thead>
            <tr>
              <th className="gantt-th-task">Task</th>
              <th className="gantt-th-chart">
                <div className="gantt-head">
                  {ticks.map((tick) => (
                    <div
                      key={`${tick.x}-${tick.label}`}
                      className="gantt-tick"
                      style={{ left: `${tick.x * 100}%` }}
                    >
                      <span>{tick.label}</span>
                    </div>
                  ))}
                  {todayX != null ? (
                    <div
                      className="gantt-today-head"
                      style={{ left: `${todayX * 100}%` }}
                    />
                  ) : null}
                </div>
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
                    const bar = ganttBar(ganttWin, task.startDate, task.endDate);
                    const dependency = task.dependsOnId
                      ? byId.get(task.dependsOnId)
                      : undefined;
                    const status = derivedTaskStatus(task);
                    const statusClass = STATUS_CLASS[status] ?? "s0";
                    return (
                      <tr key={task.id} className="gantt-data-row">
                        <td className="gantt-label">
                          <div className="gantt-label-name">
                            <span className={`gantt-sym ${statusClass}`} aria-hidden>
                              {statusSymbol(status)}
                            </span>
                            {task.name}
                          </div>
                          <div className="gantt-label-meta">
                            {[
                              task.owner || task.role,
                              dependency ? `after ${dependency.name}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </td>
                        <td className="gantt-track-cell">
                          <div className="gantt-track">
                            {ticks.map((tick) => (
                              <div
                                key={`grid-${task.id}-${tick.x}`}
                                className="gantt-vline"
                                style={{ left: `${tick.x * 100}%` }}
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
                                </span>
                              </div>
                            ) : (
                              <div className="gantt-bar-empty">Outside period</div>
                            )}
                          </div>
                        </td>
                      </tr>
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
