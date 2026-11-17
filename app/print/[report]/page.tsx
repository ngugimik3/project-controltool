/* eslint-disable @next/next/no-img-element */
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { requireUser } from "@/lib/auth";
import { STAGES, TASK_STATUS } from "@/lib/constants";
import { CHECK_KINDS } from "@/lib/defaults";
import { getSelectedProject } from "@/lib/data";
import {
  checkLabel,
  finance,
  fmt,
  fmtDate,
  ganttDates,
  ganttTicks,
  ganttWindow,
  isStepKind,
  sortedTasks,
  stageLabel,
} from "@/lib/planner";
import type { CheckItemView } from "@/lib/types";

const DAY = 86_400_000;

function time(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`).getTime();
}

function meta(project: NonNullable<Awaited<ReturnType<typeof getSelectedProject>>>) {
  return `${project.name} · ${project.client} · ${project.type} · ${stageLabel(project.stage)}`;
}

function Attachments({ items }: { items: CheckItemView[] }) {
  const withFiles = items.filter((item) => item.attachments.length > 0);
  if (!withFiles.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <h3>Attachments</h3>
      {withFiles.map((item) => (
        <div key={item.id} style={{ marginBottom: 10 }}>
          <strong>{item.item}</strong>
          <div>
            {item.attachments.map((file) =>
              file.isImage ? (
                <img
                  key={file.id}
                  src={`/api/attachments/${file.id}`}
                  alt={file.name}
                  style={{ maxWidth: "46%", margin: 4 }}
                />
              ) : (
                <span key={file.id} style={{ marginRight: 12 }}>
                  {file.name}
                </span>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistPrint({
  project,
  kind,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getSelectedProject>>>;
  kind: string;
}) {
  const items = project.checkItems
    .filter((item) => item.kind === kind)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const note = project.notes.find((entry) => entry.key === kind)?.text ?? "";

  if (isStepKind(kind)) {
    return (
      <>
        <h2>{checkLabel(kind)}</h2>
        <p className="print-meta">
          {meta(project)}
          <br />
          Printed {new Date().toLocaleString("en-GB")}
        </p>
        <table className="tbl">
          <thead>
            <tr>
              <th>Step</th>
              <th>Status</th>
              <th>Reviews and status updates</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.item}</td>
                  <td>{TASK_STATUS[item.status] ?? TASK_STATUS[0]}</td>
                  <td>
                    {item.reviews.length ? (
                      item.reviews.map((review) => (
                        <div key={review.id} style={{ marginBottom: 6 }}>
                          <strong>
                            v{review.version} · {review.date} · {review.author}
                          </strong>{" "}
                          {review.status}
                          <br />
                          {review.text}
                        </div>
                      ))
                    ) : (
                      <span>No reviews recorded.</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="empty">
                  No steps.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <h3>Stage reviews and status updates</h3>
        {project.stageReviews.filter((review) => review.key === kind).length ? (
          project.stageReviews
            .filter((review) => review.key === kind)
            .map((review) => (
              <div key={review.id} style={{ marginBottom: 8 }}>
                <strong>
                  v{review.version} · {review.date} · {review.author}
                </strong>{" "}
                {review.status}
                <br />
                {review.text}
              </div>
            ))
        ) : (
          <p>No stage reviews recorded.</p>
        )}
        <Attachments items={items} />
      </>
    );
  }

  const test = kind === "fat" || kind === "sat";
  return (
    <>
      <h2>{checkLabel(kind)} checklist</h2>
      <p className="print-meta">
        {meta(project)}
        <br />
        Printed {new Date().toLocaleString("en-GB")}
      </p>
      <table className="tbl">
        <thead>
          <tr>
            <th>Item</th>
            <th>{test ? "Reading" : "Detail"}</th>
            <th>Result</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {items.length ? (
            items.map((item) => (
              <tr key={item.id}>
                <td>{item.item}</td>
                <td>{item.reading}</td>
                <td>{item.result}</td>
                <td>{item.note}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="empty">
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <h3>General comments</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{note || "None."}</p>
      {kind === "sat" && project.signedBy ? (
        <p>
          Signed by {project.signedBy} on {fmtDate(project.signedAt)}.
        </p>
      ) : null}
      <Attachments items={items} />
    </>
  );
}

function SchedulePrint({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getSelectedProject>>>;
}) {
  const tasks = sortedTasks(project.tasks);
  const window = ganttWindow(project);
  const span = window.end - window.start;
  const ticks = ganttTicks(window);
  const dates = ganttDates(window);
  return (
    <>
      <h2>Project schedule</h2>
      <p className="print-meta">
        {meta(project)}
        <br />
        Period {dates.from} to {dates.to} · Printed {new Date().toLocaleString("en-GB")}
      </p>
      <div className="gh" style={{ marginLeft: "55%", width: "45%" }}>
        {ticks.map((tick) => (
          <span key={`${tick.x}-${tick.label}`} style={{ left: `${tick.x * 100}%` }}>
            {tick.label}
          </span>
        ))}
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Task</th>
            <th>Role</th>
            <th>Owner</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Depends on</th>
            <th style={{ width: "25%" }} />
          </tr>
        </thead>
        <tbody>
          {tasks.length ? (
            tasks.map((task) => {
              const left = Math.max(time(task.startDate), window.start);
              const right = Math.min(time(task.endDate) + DAY, window.end);
              const dependency = project.tasks.find(
                (candidate) => candidate.id === task.dependsOnId,
              );
              return (
                <tr key={task.id}>
                  <td>{task.name}</td>
                  <td>{task.role}</td>
                  <td>{task.owner}</td>
                  <td>{task.startDate}</td>
                  <td>{task.endDate}</td>
                  <td>{TASK_STATUS[task.status] ?? TASK_STATUS[0]}</td>
                  <td>{dependency?.name ?? ""}</td>
                  <td className={`gt s${task.status}`}>
                    {right > left ? (
                      <i
                        className={`s${task.status}`}
                        style={{
                          left: `${((left - window.start) / span) * 100}%`,
                          width: `${Math.max(1, ((right - left) / span) * 100)}%`,
                        }}
                      />
                    ) : null}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={8} className="empty">
                No tasks.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="print-meta">
        Stage: {STAGES[project.stage] ?? STAGES[0]} ·{" "}
        {project.tasks.filter((task) => task.status === 3).length} of {project.tasks.length}{" "}
        tasks done.
      </p>
    </>
  );
}

function CostingPrint({
  project,
}: {
  project: NonNullable<Awaited<ReturnType<typeof getSelectedProject>>>;
}) {
  const figures = finance(project);
  const margin = project.contract - figures.forecast;
  const percent = project.contract ? (margin / project.contract) * 100 : 0;

  return (
    <>
      <h2>Project costing</h2>
      <p className="print-meta">
        {meta(project)}
        <br />
        Printed {new Date().toLocaleString("en-GB")}
      </p>
      <table className="tbl" style={{ maxWidth: 520 }}>
        <tbody>
          <tr>
            <th>Project value</th>
            <td>{fmt(project.contract)}</td>
          </tr>
          <tr>
            <th>Budget</th>
            <td>{fmt(figures.budget)}</td>
          </tr>
          <tr>
            <th>Committed (POs)</th>
            <td>{fmt(figures.committed)}</td>
          </tr>
          <tr>
            <th>Actual</th>
            <td>{fmt(figures.actual)}</td>
          </tr>
          <tr>
            <th>Forecast</th>
            <td>{fmt(figures.forecast)}</td>
          </tr>
          <tr>
            <th>Margin</th>
            <td>
              {fmt(margin)} ({percent.toFixed(1)}%)
            </td>
          </tr>
        </tbody>
      </table>
      <h3>Cost lines</h3>
      <table className="tbl">
        <thead>
          <tr>
            <th>Cost code</th>
            <th style={{ textAlign: "right" }}>Budget</th>
            <th style={{ textAlign: "right" }}>Actual</th>
          </tr>
        </thead>
        <tbody>
          {project.costLines.length ? (
            project.costLines.map((line) => (
              <tr key={line.id}>
                <td>{line.code}</td>
                <td style={{ textAlign: "right" }}>{fmt(line.budget)}</td>
                <td style={{ textAlign: "right" }}>{fmt(line.actual)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="empty">
                No cost lines.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

async function PrintContent({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  await requireUser();
  const { report } = await params;
  const query = await searchParams;
  const kind = Array.isArray(query.kind) ? query.kind[0] : query.kind;
  const project = await getSelectedProject();
  if (!project) notFound();

  if (!["checklist", "steps", "schedule", "costing"].includes(report)) notFound();
  if ((report === "checklist" || report === "steps") && !kind) notFound();
  if (kind && !(CHECK_KINDS as readonly string[]).includes(kind)) notFound();
  if (report === "steps" && kind && !isStepKind(kind)) notFound();

  const back =
    report === "schedule"
      ? "/schedule"
      : report === "costing"
        ? "/costing"
        : kind === "survey"
          ? "/survey"
          : kind === "fat"
            ? "/fat"
            : kind === "install"
              ? "/install"
              : kind === "commis"
                ? "/commis"
                : kind === "sat"
                  ? "/sat"
                  : kind === "training"
                    ? "/training"
                    : "/support";

  return (
    <div className="print-shell">
      <div className="print-actions no-print">
        <PrintButton />
        <Link className="btn btg" href={back}>
          Back
        </Link>
        {report === "schedule" ? (
          <a className="btn btg" href="/api/export/schedule" download>
            Download CSV
          </a>
        ) : null}
        {report === "costing" ? (
          <a className="btn btg" href="/api/export/costing" download>
            Download CSV
          </a>
        ) : null}
      </div>
      <div className="print-brand">
        <Image
          src="/images/idw-frjolC_1793681920400.png"
          alt="Davis & Shirtliff"
          width={160}
          height={60}
          priority
        />
        <span className="print-brand-name">Project Control</span>
      </div>
      {report === "checklist" && kind ? (
        <ChecklistPrint project={project} kind={kind} />
      ) : report === "steps" && kind ? (
        <ChecklistPrint project={project} kind={kind} />
      ) : report === "schedule" ? (
        <SchedulePrint project={project} />
      ) : (
        <CostingPrint project={project} />
      )}
    </div>
  );
}

export default function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ report: string }>;
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="print-shell">Loading report…</div>}>
      <PrintContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
