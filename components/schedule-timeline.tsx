"use client";

import { useState } from "react";
import { ActionButton, AutoForm } from "@/components/forms";
import { GanttChart } from "@/components/gantt-chart";
import { TableGantt } from "@/components/table-gantt";
import { saveGanttAction } from "@/lib/actions/task";
import { useProjectTasks } from "@/components/use-project-tasks";
import type { GanttWindow } from "@/lib/planner";
import type { ProjectView, TaskView } from "@/lib/types";

export type TimelineFormat = "gantt" | "table";

export function ScheduleTimeline({
  project,
  tasks,
  ganttWindow: win,
  initialFormat = "gantt",
}: {
  project: ProjectView;
  tasks: TaskView[];
  ganttWindow: GanttWindow;
  initialFormat?: TimelineFormat;
}) {
  const [format, setFormat] = useState<TimelineFormat>(initialFormat);
  const [showPeriod, setShowPeriod] = useState(false);
  const { data: liveTasks } = useProjectTasks(project.id, tasks);
  const timelineTasks = liveTasks ?? tasks;
  const gantt = (project.extra.gantt ?? {}) as {
    from?: string;
    to?: string;
    unit?: string;
  };

  return (
    <div className="schedule-timeline">
      <div className="schedule-timeline-bar no-print">
        <div className="schedule-timeline-controls">
          <div className="format-toggle" role="group" aria-label="Timeline format">
            <button
              type="button"
              className={format === "gantt" ? "on" : undefined}
              aria-pressed={format === "gantt"}
              onClick={() => setFormat("gantt")}
            >
              Gantt
            </button>
            <button
              type="button"
              className={format === "table" ? "on" : undefined}
              aria-pressed={format === "table"}
              onClick={() => setFormat("table")}
            >
              Table-Gantt
            </button>
          </div>
          <button
            type="button"
            className={`btn btg${showPeriod ? " on" : ""}`}
            aria-expanded={showPeriod}
            onClick={() => setShowPeriod((value) => !value)}
          >
            Period
          </button>
        </div>
        <a
          className="btn btp"
          href={`/print/schedule?project=${project.id}&format=${format}`}
          target="_blank"
          rel="noreferrer"
        >
          Print / PDF
        </a>
      </div>

      {showPeriod ? (
        <div className="gantt-period-panel no-print">
          <AutoForm action={saveGanttAction} className="f gantt-period-form">
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
              <select name="unit" defaultValue={win.unit}>
                <option value="day">Days</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
              </select>
            </label>
          </AutoForm>
          <ActionButton
            action={saveGanttAction}
            fields={{
              projectId: project.id,
              from: "",
              to: "",
              unit: win.unit,
            }}
            label="Fit to tasks"
            className="btn btg"
          />
        </div>
      ) : null}

      <div
        className={`timeline-panel${format === "gantt" ? " is-active" : ""}`}
        data-format="gantt"
      >
        <GanttChart
          tasks={timelineTasks}
          window={win}
          groupByStage
          projectId={project.id}
          editable
        />
      </div>
      <div
        className={`timeline-panel${format === "table" ? " is-active" : ""}`}
        data-format="table"
      >
        <TableGantt
          tasks={timelineTasks}
          window={win}
          defaultExpanded
          projectId={project.id}
          editable
        />
      </div>
    </div>
  );
}
