/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GanttChart } from "@/components/gantt-chart";
import { PrintButton } from "@/components/print-button";
import { TableGantt } from "@/components/table-gantt";
import { requireProjectAccess } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { STAGES, TASK_STATUS } from "@/lib/constants";
import { CHECK_KINDS } from "@/lib/defaults";
import { getProjectById, getSelectedProject } from "@/lib/data";
import {
  checkLabel,
  derivedTaskStatus,
  finance,
  fmt,
  fmtDate,
  ganttDates,
  ganttWindow,
  isStepKind,
  sortedTasks,
  stageLabel,
  statusSymbol,
} from "@/lib/planner";
import type { CheckItemView, ProjectView } from "@/lib/types";

function printedAt() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PrintHeader({
  project,
  title,
  subtitle,
}: {
  project: ProjectView;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="print-doc-header">
      <div className="print-brand">
        <Image
          src="/images/idw-frjolC_1793681920400.png"
          alt="Davis & Shirtliff"
          width={148}
          height={56}
          priority
        />
        <div className="print-brand-copy">
          <span className="print-brand-name">Project Control</span>
          <span className="print-brand-tag">Davis &amp; Shirtliff</span>
        </div>
      </div>
      <div className="print-doc-title-block">
        <h1 className="print-doc-title">{title}</h1>
        {subtitle ? <p className="print-doc-subtitle">{subtitle}</p> : null}
      </div>
      <div className="print-meta-grid">
        <div>
          <span className="print-meta-label">Project</span>
          <strong>{project.name}</strong>
        </div>
        <div>
          <span className="print-meta-label">Client</span>
          <strong>{project.client || "—"}</strong>
        </div>
        <div>
          <span className="print-meta-label">Type</span>
          <strong>{project.type || "—"}</strong>
        </div>
        <div>
          <span className="print-meta-label">Stage</span>
          <strong>{stageLabel(project.stage)}</strong>
        </div>
        <div>
          <span className="print-meta-label">Printed</span>
          <strong>{printedAt()}</strong>
        </div>
      </div>
    </header>
  );
}

function PrintFooter({ project }: { project: ProjectView }) {
  return (
    <footer className="print-doc-footer">
      <span>
        {project.name} · {project.client}
      </span>
      <span>Project Control · Confidential</span>
    </footer>
  );
}

function Attachments({ items }: { items: CheckItemView[] }) {
  const withFiles = items.filter((item) => item.attachments.length > 0);
  if (!withFiles.length) return null;
  return (
    <section className="print-section">
      <h2 className="print-section-title">Attachments</h2>
      <div className="print-attach-grid">
        {withFiles.map((item) => (
          <div key={item.id} className="print-attach-block">
            <strong>{item.item}</strong>
            <div className="print-attach-files">
              {item.attachments.map((file) =>
                file.isImage ? (
                  <figure key={file.id} className="print-attach-figure">
                    <img src={`/api/attachments/${file.id}`} alt={file.name} />
                    <figcaption>{file.name}</figcaption>
                  </figure>
                ) : (
                  <span key={file.id} className="print-attach-file">
                    {file.name}
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChecklistPrint({
  project,
  kind,
}: {
  project: ProjectView;
  kind: string;
}) {
  const items = project.checkItems
    .filter((item) => item.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const note = project.notes.find((entry) => entry.key === kind)?.text ?? "";
  const title = isStepKind(kind)
    ? checkLabel(kind)
    : `${checkLabel(kind)} checklist`;

  if (isStepKind(kind)) {
    const stageNotes = project.stageReviews.filter(
      (review) => review.key === kind,
    );
    return (
      <>
        <PrintHeader
          project={project}
          title={title}
          subtitle="Delivery steps and reviews"
        />
        <section className="print-section">
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "28%" }}>Step</th>
                <th style={{ width: "12%" }}>Status</th>
                <th>Reviews and status updates</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="print-strong">{item.item}</td>
                    <td>
                      <span className={`print-status s${item.status}`}>
                        {TASK_STATUS[item.status] ?? TASK_STATUS[0]}
                      </span>
                    </td>
                    <td>
                      {item.reviews.length ? (
                        <div className="print-review-list">
                          {item.reviews.map((review) => (
                            <div key={review.id} className="print-review">
                              <div className="print-review-head">
                                v{review.version} · {review.date} ·{" "}
                                {review.author}
                                {review.status ? ` · ${review.status}` : ""}
                              </div>
                              <div className="print-review-body">
                                {review.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="print-muted">
                          No reviews recorded.
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="print-empty">
                    No steps.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="print-section">
          <h2 className="print-section-title">Stage reviews</h2>
          {stageNotes.length ? (
            <div className="print-review-list">
              {stageNotes.map((review) => (
                <div key={review.id} className="print-review print-review-card">
                  <div className="print-review-head">
                    v{review.version} · {review.date} · {review.author}
                    {review.status ? ` · ${review.status}` : ""}
                  </div>
                  <div className="print-review-body">{review.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="print-muted">No stage reviews recorded.</p>
          )}
        </section>
        <Attachments items={items} />
        <PrintFooter project={project} />
      </>
    );
  }

  const test = kind === "fat" || kind === "sat";
  return (
    <>
      <PrintHeader
        project={project}
        title={title}
        subtitle={
          test ? "Factory / site acceptance checklist" : "Site checklist"
        }
      />
      <section className="print-section">
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Item</th>
              <th style={{ width: "18%" }}>{test ? "Reading" : "Detail"}</th>
              <th style={{ width: "12%" }}>Result</th>
              <th>Comment</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="print-strong">{item.item}</td>
                  <td>{item.reading || "—"}</td>
                  <td>
                    <span
                      className={`print-result ${
                        item.result === "Pass"
                          ? "ok"
                          : item.result === "Fail"
                            ? "bad"
                            : ""
                      }`}
                    >
                      {item.result || "—"}
                    </span>
                  </td>
                  <td>{item.note || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="print-empty">
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="print-section print-two-col">
        <div>
          <h2 className="print-section-title">General comments</h2>
          <p className="print-notes">{note || "None."}</p>
        </div>
        {kind === "sat" ? (
          <div className="print-signoff">
            <h2 className="print-section-title">Sign-off</h2>
            {project.signedBy ? (
              <p>
                Signed by <strong>{project.signedBy}</strong>
                <br />
                on {fmtDate(project.signedAt) || "—"}
              </p>
            ) : (
              <div className="print-sign-lines">
                <div>
                  <span>Name</span>
                  <i />
                </div>
                <div>
                  <span>Signature</span>
                  <i />
                </div>
                <div>
                  <span>Date</span>
                  <i />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </section>
      <Attachments items={items} />
      <PrintFooter project={project} />
    </>
  );
}

function SchedulePrint({
  project,
  format = "table",
}: {
  project: ProjectView;
  format?: "gantt" | "table";
}) {
  const tasks = sortedTasks(project.tasks);
  const win = ganttWindow(project);
  const dates = ganttDates(win);
  const statuses = tasks.map((task) => derivedTaskStatus(task));
  const done = statuses.filter((status) => status === 3).length;
  const attention = statuses.filter((status) => status === 2).length;

  return (
    <div className="print-schedule">
      <PrintHeader
        project={project}
        title="Project schedule"
        subtitle={`Date range ${dates.from} → ${dates.to}`}
      />

      <section className="print-section">
        <div className="print-kpi-row">
          <div className="print-kpi">
            <span>Tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="print-kpi">
            <span>Done</span>
            <strong>
              {done}/{tasks.length}
            </strong>
          </div>
          <div className="print-kpi">
            <span>Blocked / overdue</span>
            <strong>{attention}</strong>
          </div>
          <div className="print-kpi">
            <span>Stage</span>
            <strong>{STAGES[project.stage] ?? STAGES[0]}</strong>
          </div>
        </div>
      </section>

      <section className="print-section">
        <h2 className="print-section-title">
          {format === "gantt" ? "Gantt chart" : "Table-Gantt"}
        </h2>
        {format === "gantt" ? (
          <GanttChart tasks={tasks} window={win} variant="print" groupByStage />
        ) : (
          <TableGantt tasks={tasks} window={win} variant="print" />
        )}
      </section>

      {format === "gantt" ? (
        <section className="print-section">
          <h2 className="print-section-title">Task list</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Owner</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length ? (
                tasks.map((task) => {
                  const status = derivedTaskStatus(task);
                  return (
                    <tr key={task.id}>
                      <td className="print-strong">{task.name}</td>
                      <td>{task.owner || "—"}</td>
                      <td>{task.startDate}</td>
                      <td>{task.endDate}</td>
                      <td>
                        <span className={`print-status s${status}`}>
                          {statusSymbol(status)}{" "}
                          {TASK_STATUS[status] ?? TASK_STATUS[0]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="print-empty">
                    No tasks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ) : null}
      <PrintFooter project={project} />
    </div>
  );
}

function CostingPrint({ project }: { project: ProjectView }) {
  const figures = finance(project);
  const margin = project.contract - figures.forecast;
  const percent = project.contract ? (margin / project.contract) * 100 : 0;

  return (
    <>
      <PrintHeader
        project={project}
        title="Project costing"
        subtitle="Budget, commitment and margin summary"
      />

      <section className="print-section">
        <div className="print-kpi-row costing">
          <div className="print-kpi">
            <span>Project value</span>
            <strong>{fmt(project.contract)}</strong>
          </div>
          <div className="print-kpi">
            <span>Budget</span>
            <strong>{fmt(figures.budget)}</strong>
          </div>
          <div className="print-kpi">
            <span>Committed</span>
            <strong>{fmt(figures.committed)}</strong>
          </div>
          <div className="print-kpi">
            <span>Actual</span>
            <strong>{fmt(figures.actual)}</strong>
          </div>
          <div className="print-kpi">
            <span>Forecast</span>
            <strong>{fmt(figures.forecast)}</strong>
          </div>
          <div className={`print-kpi ${margin < 0 ? "bad" : "ok"}`}>
            <span>Margin</span>
            <strong>
              {fmt(margin)}
              <small>({percent.toFixed(1)}%)</small>
            </strong>
          </div>
        </div>
      </section>

      <section className="print-section">
        <h2 className="print-section-title">Cost lines</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Cost code</th>
              <th style={{ textAlign: "right" }}>Budget</th>
              <th style={{ textAlign: "right" }}>Actual</th>
              <th style={{ textAlign: "right" }}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {project.costLines.length ? (
              project.costLines.map((line) => {
                const variance = line.budget - line.actual;
                return (
                  <tr key={line.id}>
                    <td className="print-strong">{line.code}</td>
                    <td style={{ textAlign: "right" }}>{fmt(line.budget)}</td>
                    <td style={{ textAlign: "right" }}>{fmt(line.actual)}</td>
                    <td
                      style={{ textAlign: "right" }}
                      className={variance < 0 ? "print-neg" : ""}
                    >
                      {fmt(variance)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="print-empty">
                  No cost lines.
                </td>
              </tr>
            )}
          </tbody>
          {project.costLines.length ? (
            <tfoot>
              <tr>
                <th>Total</th>
                <th style={{ textAlign: "right" }}>{fmt(figures.budget)}</th>
                <th style={{ textAlign: "right" }}>{fmt(figures.actual)}</th>
                <th style={{ textAlign: "right" }}>
                  {fmt(figures.budget - figures.actual)}
                </th>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </section>
      <PrintFooter project={project} />
    </>
  );
}

async function PrintContent({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{
    kind?: string | string[];
    format?: string | string[];
    project?: string | string[];
    projectId?: string | string[];
  }>;
}) {
  await requireUser();
  const { report } = await params;
  const query = await searchParams;
  const kind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const formatRaw = Array.isArray(query.format)
    ? query.format[0]
    : query.format;
  const scheduleFormat = formatRaw === "gantt" ? "gantt" : "table";
  const projectRaw = query.project ?? query.projectId;
  const projectParam = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw;
  if (projectParam) await requireProjectAccess(projectParam);
  const project = projectParam
    ? await getProjectById(projectParam)
    : await getSelectedProject();
  if (!project) notFound();

  const scheduleHref = (format?: "gantt") => {
    const search = new URLSearchParams();
    if (projectParam) search.set("project", projectParam);
    if (format) search.set("format", format);
    const suffix = search.toString();
    return `/print/schedule${suffix ? `?${suffix}` : ""}`;
  };

  if (!["checklist", "steps", "schedule", "costing"].includes(report))
    notFound();
  if ((report === "checklist" || report === "steps") && !kind) notFound();
  if (kind && !(CHECK_KINDS as readonly string[]).includes(kind)) notFound();
  if (report === "steps" && kind && !isStepKind(kind)) notFound();

  const base = `/projects/${project.id}`;
  const back =
    report === "schedule"
      ? `${base}/schedule`
      : report === "costing"
        ? `${base}/costing`
        : kind === "survey"
          ? `${base}/survey`
          : kind === "fat"
            ? `${base}/fat`
            : kind === "install"
              ? `${base}/install`
              : kind === "commis"
                ? `${base}/commis`
                : kind === "sat"
                  ? `${base}/sat`
                  : kind === "training"
                    ? `${base}/training`
                    : `${base}/support`;

  return (
    <div
      className={`print-shell${report === "schedule" ? " print-shell-landscape" : ""}`}
    >
      {report === "schedule" ? (
        <style>{`
          @media print {
            @page { size: A4 landscape; margin: 10mm; }
          }
        `}</style>
      ) : null}
      <div className="print-actions no-print">
        <PrintButton />
        <Link className="btn btg" href={back}>
          Back
        </Link>
        {report === "schedule" ? (
          <>
            <Link
              className={`btn btg${scheduleFormat === "table" ? " btp" : ""}`}
              href={scheduleHref()}
            >
              Table-Gantt
            </Link>
            <Link
              className={`btn btg${scheduleFormat === "gantt" ? " btp" : ""}`}
              href={scheduleHref("gantt")}
            >
              Gantt
            </Link>
            <a
              className="btn btg"
              href={`/api/export/schedule?project=${project.id}`}
              download
            >
              Download Excel
            </a>
          </>
        ) : null}
        {report === "costing" ? (
          <a
            className="btn btg"
            href={`/api/export/costing?project=${project.id}`}
            download
          >
            Download Excel
          </a>
        ) : null}
      </div>
      <article className="print-doc">
        {report === "checklist" && kind ? (
          <ChecklistPrint project={project} kind={kind} />
        ) : report === "steps" && kind ? (
          <ChecklistPrint project={project} kind={kind} />
        ) : report === "schedule" ? (
          <SchedulePrint project={project} format={scheduleFormat} />
        ) : (
          <CostingPrint project={project} />
        )}
      </article>
    </div>
  );
}

export default function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{
    kind?: string | string[];
    format?: string | string[];
    project?: string | string[];
  }>;
}) {
  return (
    <Suspense fallback={<div className="print-shell">Loading report…</div>}>
      <PrintContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
