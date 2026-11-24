import type ExcelJS from "exceljs";
import { PO_STATUS, TASK_STATUS } from "@/lib/constants";
import {
  EXCEL,
  autoFit,
  createWorkbook,
  integer,
  money,
  paintStatus,
  percent,
  projectSlug,
  styleBodyRow,
  styleHeaderRow,
  styleMetaLabel,
  styleMetaValue,
  styleSection,
  styleTitle,
} from "@/lib/excel";
import {
  derivedTaskStatus,
  finance,
  ganttDates,
  ganttWindow,
  isPoSlipping,
  isTaskOverdue,
  sortedTasks,
  stageLabel,
  taskDays,
  taskPercent,
  taskStageIndex,
  todayISO,
} from "@/lib/planner";
import type { ProjectView } from "@/lib/types";

function exportedAt(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

function filename(project: ProjectView, kind: string): string {
  return `${projectSlug(project.name)}-${kind}-${todayISO()}.xlsx`;
}

function writeProjectBanner(
  sheet: ExcelJS.Worksheet,
  project: ProjectView,
  title: string,
  extras: [string, ExcelJS.CellValue][] = [],
): number {
  styleTitle(sheet.getCell(1, 1), title);
  sheet.mergeCells(1, 1, 1, 4);
  sheet.getRow(1).height = 28;

  const meta: [string, ExcelJS.CellValue][] = [
    ["Exported at", exportedAt()],
    ["Project", project.name],
    ["Client", project.client || "—"],
    ["Type", project.type || "—"],
    ["Stage", stageLabel(project.stage)],
    ["Contract value", project.contract],
    ...extras,
  ];

  let row = 3;
  for (const [label, value] of meta) {
    styleMetaLabel(sheet.getCell(row, 1), label);
    if (label === "Contract value" && typeof value === "number") {
      money(sheet.getCell(row, 2), value);
    } else {
      styleMetaValue(sheet.getCell(row, 2), value);
    }
    row += 1;
  }
  return row + 1;
}

function statusTone(label: string): "good" | "warn" | "bad" | "neutral" {
  if (label === "Done" || label === "Under / on" || label === "No") return "good";
  if (label === "In progress" || label === "Empty") return "warn";
  if (
    label === "Blocked" ||
    label === "Overdue" ||
    label === "Yes" ||
    label === "Over" ||
    label === "Overspend"
  ) {
    return "bad";
  }
  return "neutral";
}

export async function buildScheduleWorkbook(project: ProjectView): Promise<{
  filename: string;
  workbook: ExcelJS.Workbook;
}> {
  const workbook = createWorkbook(`${project.name} — Schedule`);
  const tasks = sortedTasks(project.tasks);
  const today = todayISO();
  const window = ganttDates(ganttWindow(project));

  const counts = { notStarted: 0, inProgress: 0, blocked: 0, done: 0, overdue: 0 };
  for (const task of tasks) {
    const derived = derivedTaskStatus(task, today);
    if (derived === 0) counts.notStarted += 1;
    else if (derived === 1) counts.inProgress += 1;
    else if (derived === 2) counts.blocked += 1;
    else counts.done += 1;
    if (isTaskOverdue(task, today)) counts.overdue += 1;
  }

  const summary = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });
  let row = writeProjectBanner(summary, project, "Project schedule", [
    ["Schedule from", window.from],
    ["Schedule to", window.to],
  ]);

  styleSection(summary.getCell(row, 1), "Snapshot");
  row += 1;

  const kpis: [string, number, "good" | "warn" | "bad" | "neutral"][] = [
    ["Total tasks", tasks.length, "neutral"],
    ["Done", counts.done, "good"],
    ["In progress", counts.inProgress, "warn"],
    ["Blocked / overdue (working)", counts.blocked, counts.blocked ? "bad" : "good"],
    ["Not started", counts.notStarted, "neutral"],
    ["Past end date (overdue)", counts.overdue, counts.overdue ? "bad" : "good"],
  ];

  styleHeaderRow(summary.getRow(row), 2);
  summary.getCell(row, 1).value = "Metric";
  summary.getCell(row, 2).value = "Value";
  row += 1;

  for (const [label, value, tone] of kpis) {
    const dataRow = summary.getRow(row);
    styleBodyRow(dataRow, 2, row % 2 === 0);
    dataRow.getCell(1).value = label;
    integer(dataRow.getCell(2), value);
    paintStatus(dataRow.getCell(2), tone);
    row += 1;
  }
  autoFit(summary, 14, 36);

  const sheet = workbook.addWorksheet("Tasks", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const headers = [
    "#",
    "Stage",
    "Task",
    "Role",
    "Owner",
    "Start",
    "End",
    "Duration (days)",
    "Status",
    "Working status",
    "Progress %",
    "Overdue",
    "Depends on",
  ];
  styleHeaderRow(sheet.getRow(1), headers.length);
  headers.forEach((header, index) => {
    sheet.getCell(1, index + 1).value = header;
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, tasks.length + 1), column: headers.length },
  };

  tasks.forEach((task, index) => {
    const r = index + 2;
    const dependency = project.tasks.find((item) => item.id === task.dependsOnId);
    const derived = derivedTaskStatus(task, today);
    const overdue = isTaskOverdue(task, today);
    const working = TASK_STATUS[derived] ?? TASK_STATUS[0];
    const stored = TASK_STATUS[task.status] ?? TASK_STATUS[0];
    const dataRow = sheet.getRow(r);
    styleBodyRow(dataRow, headers.length, index % 2 === 1);

    integer(dataRow.getCell(1), index + 1);
    dataRow.getCell(2).value = stageLabel(taskStageIndex(task));
    dataRow.getCell(3).value = task.name;
    dataRow.getCell(3).font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: `FF${EXCEL.ink}` },
    };
    dataRow.getCell(4).value = task.role;
    dataRow.getCell(5).value = task.owner;
    dataRow.getCell(6).value = task.startDate;
    dataRow.getCell(7).value = task.endDate;
    integer(dataRow.getCell(8), taskDays(task.startDate, task.endDate));
    dataRow.getCell(9).value = stored;
    paintStatus(dataRow.getCell(9), statusTone(stored));
    dataRow.getCell(10).value = working;
    paintStatus(dataRow.getCell(10), statusTone(working));
    percent(dataRow.getCell(11), taskPercent(task, today));
    dataRow.getCell(12).value = overdue ? "Yes" : "No";
    paintStatus(dataRow.getCell(12), overdue ? "bad" : "good");
    dataRow.getCell(13).value = dependency?.name ?? "";
  });

  autoFit(sheet, 10, 40);
  sheet.getColumn(3).width = 36;

  return { filename: filename(project, "schedule"), workbook };
}

export async function buildCostingWorkbook(project: ProjectView): Promise<{
  filename: string;
  workbook: ExcelJS.Workbook;
}> {
  const workbook = createWorkbook(`${project.name} — Costing`);
  const figures = finance(project);
  const margin = project.contract - figures.forecast;
  const marginPct = project.contract ? (margin / project.contract) * 100 : 0;
  const varianceTotal = figures.budget - figures.actual;
  const overBudget = figures.budget > 0 && figures.forecast > figures.budget;

  const summary = workbook.addWorksheet("Summary", {
    views: [{ showGridLines: false }],
  });
  let row = writeProjectBanner(summary, project, "Project costing");

  styleSection(summary.getCell(row, 1), "Financial snapshot");
  row += 1;

  styleHeaderRow(summary.getRow(row), 3);
  summary.getCell(row, 1).value = "Metric";
  summary.getCell(row, 2).value = "Value";
  summary.getCell(row, 3).value = "Notes";
  row += 1;

  const metrics: {
    label: string;
    value: number;
    note: string;
    tone?: "good" | "warn" | "bad" | "neutral";
    asPercent?: boolean;
  }[] = [
    { label: "Project value", value: project.contract, note: "" },
    { label: "Budget", value: figures.budget, note: "Sum of cost codes" },
    {
      label: "Committed (POs)",
      value: figures.committed,
      note: "Approved+ purchase orders",
    },
    { label: "Actual", value: figures.actual, note: "Sum of cost code actuals" },
    {
      label: "Forecast",
      value: figures.forecast,
      note: overBudget ? "Above budget" : "Highest of budget, committed, actual",
      tone: overBudget ? "bad" : "neutral",
    },
    {
      label: "Margin",
      value: margin,
      note: `${marginPct.toFixed(1)}% of project value`,
      tone: margin < 0 ? "bad" : "good",
    },
    {
      label: "Budget vs actual",
      value: varianceTotal,
      note: varianceTotal < 0 ? "Overspend" : "Underspend",
      tone: varianceTotal < 0 ? "bad" : "good",
    },
  ];

  for (const metric of metrics) {
    const dataRow = summary.getRow(row);
    styleBodyRow(dataRow, 3, row % 2 === 0);
    dataRow.getCell(1).value = metric.label;
    money(dataRow.getCell(2), metric.value);
    if (metric.tone) paintStatus(dataRow.getCell(2), metric.tone);
    dataRow.getCell(3).value = metric.note;
    row += 1;
  }
  autoFit(summary, 14, 48);

  const codes = workbook.addWorksheet("Cost codes", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const codeHeaders = [
    "Cost code",
    "Budget",
    "Actual",
    "Variance",
    "% of budget",
    "Status",
  ];
  styleHeaderRow(codes.getRow(1), codeHeaders.length);
  codeHeaders.forEach((header, index) => {
    codes.getCell(1, index + 1).value = header;
  });

  project.costLines.forEach((line, index) => {
    const r = index + 2;
    const variance = line.budget - line.actual;
    const spentPct =
      line.budget > 0 ? (line.actual / line.budget) * 100 : line.actual > 0 ? 100 : 0;
    const status =
      variance < 0 ? "Over" : variance === 0 && line.budget === 0 ? "Empty" : "Under / on";
    const dataRow = codes.getRow(r);
    styleBodyRow(dataRow, codeHeaders.length, index % 2 === 1);
    dataRow.getCell(1).value = line.code;
    dataRow.getCell(1).font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: `FF${EXCEL.ink}` },
    };
    money(dataRow.getCell(2), line.budget);
    money(dataRow.getCell(3), line.actual);
    money(dataRow.getCell(4), variance);
    paintStatus(dataRow.getCell(4), variance < 0 ? "bad" : "good");
    percent(dataRow.getCell(5), spentPct);
    dataRow.getCell(6).value = status;
    paintStatus(dataRow.getCell(6), statusTone(status));
  });

  if (project.costLines.length) {
    const totalRow = codes.getRow(project.costLines.length + 2);
    styleBodyRow(totalRow, codeHeaders.length, false);
    for (let col = 1; col <= codeHeaders.length; col += 1) {
      totalRow.getCell(col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${EXCEL.totalBg}` },
      };
      totalRow.getCell(col).font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: `FF${EXCEL.navy}` },
      };
    }
    totalRow.getCell(1).value = "TOTAL";
    money(totalRow.getCell(2), figures.budget);
    money(totalRow.getCell(3), figures.actual);
    money(totalRow.getCell(4), varianceTotal);
    paintStatus(totalRow.getCell(4), varianceTotal < 0 ? "bad" : "good");
    if (figures.budget > 0) {
      percent(totalRow.getCell(5), (figures.actual / figures.budget) * 100);
    }
  }

  codes.autoFilter = {
    from: { row: 1, column: 1 },
    to: {
      row: Math.max(1, project.costLines.length + 1),
      column: codeHeaders.length,
    },
  };
  autoFit(codes, 12, 28);

  const pos = workbook.addWorksheet("Purchase orders", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  const poHeaders = [
    "Item",
    "Supplier",
    "Need by",
    "Promised by",
    "Cost",
    "Status",
    "Waybill",
    "Slipping",
  ];
  styleHeaderRow(pos.getRow(1), poHeaders.length);
  poHeaders.forEach((header, index) => {
    pos.getCell(1, index + 1).value = header;
  });

  project.purchaseOrders.forEach((po, index) => {
    const r = index + 2;
    const slipping = isPoSlipping(po);
    const dataRow = pos.getRow(r);
    styleBodyRow(dataRow, poHeaders.length, index % 2 === 1);
    dataRow.getCell(1).value = po.item;
    dataRow.getCell(1).font = {
      name: "Calibri",
      size: 10,
      bold: true,
      color: { argb: `FF${EXCEL.ink}` },
    };
    dataRow.getCell(2).value = po.supplier;
    dataRow.getCell(3).value = po.needBy;
    dataRow.getCell(4).value = po.promisedBy;
    money(dataRow.getCell(5), po.cost);
    dataRow.getCell(6).value = PO_STATUS[po.status] ?? PO_STATUS[0];
    dataRow.getCell(7).value = po.waybill;
    dataRow.getCell(8).value = slipping ? "Yes" : "No";
    paintStatus(dataRow.getCell(8), slipping ? "bad" : "good");
  });

  pos.autoFilter = {
    from: { row: 1, column: 1 },
    to: {
      row: Math.max(1, project.purchaseOrders.length + 1),
      column: poHeaders.length,
    },
  };
  autoFit(pos, 12, 36);
  pos.getColumn(1).width = 32;

  return { filename: filename(project, "costing"), workbook };
}
