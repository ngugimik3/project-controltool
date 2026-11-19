"use client";

import { useState } from "react";
import { GanttChart } from "@/components/gantt-chart";
import { TableGantt } from "@/components/table-gantt";
import { ganttDates, type GanttWindow } from "@/lib/planner";
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
  const dates = ganttDates(win);
  const printed = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="schedule-timeline">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
        }
      `}</style>
      <div className="schedule-timeline-bar no-print">
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
          className="btn btp"
          onClick={() => globalThis.print()}
        >
          Print / PDF
        </button>
      </div>

      <header className="schedule-print-header print-only">
        <div>
          <strong>{project.name}</strong>
          <span>
            {project.client} · {project.type}
          </span>
        </div>
        <div>
          <span>Date range</span>
          <strong>
            {dates.from} → {dates.to}
          </strong>
        </div>
        <div>
          <span>Printed</span>
          <strong>{printed}</strong>
        </div>
      </header>

      <div
        className={`timeline-panel${format === "gantt" ? " is-active" : ""}`}
        data-format="gantt"
      >
        <GanttChart tasks={tasks} window={win} groupByStage />
      </div>
      <div
        className={`timeline-panel${format === "table" ? " is-active" : ""}`}
        data-format="table"
      >
        <TableGantt tasks={tasks} window={win} defaultExpanded />
      </div>
    </div>
  );
}
