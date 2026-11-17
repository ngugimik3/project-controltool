import { getCurrentUser } from "@/lib/auth";
import { TASK_STATUS } from "@/lib/constants";
import { getSelectedProject } from "@/lib/data";
import { finance, sortedTasks, stageLabel } from "@/lib/planner";

function csv(rows: (string | number)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(","),
    )
    .join("\r\n");
}

function download(name: string, body: string) {
  return new Response(`\uFEFF${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { report } = await params;
  const project = await getSelectedProject();
  if (!project) return new Response("No project selected", { status: 404 });

  const slug =
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "project";

  if (report === "schedule") {
    const rows: (string | number)[][] = [
      ["Project schedule"],
      ["Project", project.name],
      ["Client", project.client],
      ["Type", project.type],
      ["Stage", stageLabel(project.stage)],
      [],
      ["Task", "Role", "Owner", "Start", "End", "Status", "Depends on"],
    ];
    for (const task of sortedTasks(project.tasks)) {
      const dependency = project.tasks.find((item) => item.id === task.dependsOnId);
      rows.push([
        task.name,
        task.role,
        task.owner,
        task.startDate,
        task.endDate,
        TASK_STATUS[task.status] ?? TASK_STATUS[0],
        dependency?.name ?? "",
      ]);
    }
    return download(`${slug}-schedule.csv`, csv(rows));
  }

  if (report === "costing") {
    const figures = finance(project);
    const margin = project.contract - figures.forecast;
    const rows: (string | number)[][] = [
      ["Project costing"],
      ["Project", project.name],
      ["Client", project.client],
      ["Type", project.type],
      ["Stage", stageLabel(project.stage)],
      [],
      ["Metric", "Value"],
      ["Project value", project.contract],
      ["Budget", figures.budget],
      ["Committed (POs)", figures.committed],
      ["Actual", figures.actual],
      ["Forecast", figures.forecast],
      ["Margin", margin],
      [],
      ["Cost code", "Budget", "Actual"],
    ];
    for (const line of project.costLines) {
      rows.push([line.code, line.budget, line.actual]);
    }
    return download(`${slug}-costing.csv`, csv(rows));
  }

  return new Response("Unknown export", { status: 404 });
}
