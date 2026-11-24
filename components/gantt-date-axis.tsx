import type { GanttDayColumn, GanttMonthBand } from "@/lib/planner";

/** Fixed pixel width per day — keeps every date readable; chart scrolls. */
export const GANTT_DAY_PX = 20;
export const GANTT_DAY_PX_PRINT = 18;

export function ganttAxisWidth(dayCount: number, print = false): number {
  return Math.max(dayCount * (print ? GANTT_DAY_PX_PRINT : GANTT_DAY_PX), 320);
}

export function GanttDateAxis({
  days,
  months,
  variant = "screen",
}: {
  days: GanttDayColumn[];
  months: GanttMonthBand[];
  variant?: "screen" | "print";
}) {
  const dayPx = variant === "print" ? GANTT_DAY_PX_PRINT : GANTT_DAY_PX;
  const width = ganttAxisWidth(days.length, variant === "print");

  return (
    <div
      className={`gantt-axis${variant === "print" ? " gantt-axis-print" : ""}`}
      style={{ width, minWidth: width }}
      aria-label="Daily timeline"
    >
      <div className="gantt-month-row">
        {months.map((band) => (
          <div
            key={band.key}
            className="gantt-month-band"
            style={{ width: band.count * dayPx }}
            title={band.label}
          >
            <span>{band.label}</span>
          </div>
        ))}
      </div>
      <div className="gantt-day-row">
        {days.map((day) => (
          <div
            key={day.iso}
            className={[
              "gantt-day-cell",
              day.isToday ? "is-today" : "",
              day.isWeekend ? "is-weekend" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ width: dayPx }}
            title={day.iso}
          >
            <span className="gantt-day-num">{day.day}</span>
            <span className="gantt-day-wd">{day.weekday}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
