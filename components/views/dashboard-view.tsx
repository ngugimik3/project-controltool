import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  FolderKanban,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RangeFilter } from "@/components/dashboard/range-filter";
import { StatusDonut } from "@/components/dashboard/status-donut";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PageHeader } from "@/components/page-header";
import { ProjectTable } from "@/components/project-table";
import { getActivity, getProjects } from "@/lib/data";
import {
  buildDashboard,
  RANGE_LABEL,
  type DashboardSnapshot,
  type RangeKey,
} from "@/lib/dashboard";
import { buildNeedsAction } from "@/lib/needs-action";
import { fmt } from "@/lib/planner";
import type { Role } from "@/lib/roles";
import type { ProjectView } from "@/lib/types";

const NEEDS_LIMIT = 6;
const TABLE_LIMIT = 8;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function feedTime(ts: string): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function ChartCard({
  title,
  subtitle,
  className = "",
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  className?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`chart-card ${className}`.trim()}>
      <div className="chart-head">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle ? <div className="chart-sub">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export async function DashboardSection({
  range,
  role,
}: {
  range: RangeKey;
  role: Role;
}) {
  const [projects, activity] = await Promise.all([
    getProjects(),
    getActivity(10),
  ]);
  const snapshot = buildDashboard({ projects, activity, range });

  if (!projects.length) {
    return (
      <div className="dash">
        <PageHeader
          title="Portfolio dashboard"
          subtitle="Create your first project to get started"
        />
        <div className="chart-card dash-empty-hero">
          <FolderKanban size={48} />
          <div className="chart-title">No projects yet</div>
          <p className="dash-sub">Create a project and its numbers will show up here.</p>
          <Link href="/projects" className="dash-link">
            Create a project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      projects={projects}
      role={role}
      range={range}
      snapshot={snapshot}
    />
  );
}

export function DashboardView({
  projects,
  role,
  range,
  snapshot,
}: {
  projects: ProjectView[];
  role: Role;
  range: RangeKey;
  snapshot: DashboardSnapshot;
}) {
  const { kpis } = snapshot;

  const needsAction = buildNeedsAction(projects);
  const visibleNeeds = needsAction.slice(0, NEEDS_LIMIT);
  const hiddenNeeds = needsAction.length - visibleNeeds.length;

  const activeShare = kpis.total ? Math.round((kpis.active / kpis.total) * 100) : 0;
  const createdTotal = snapshot.trend.reduce((sum, point) => sum + point.created, 0);
  const completedTotal = snapshot.trend.reduce((sum, point) => sum + point.completed, 0);

  const tableProjects = projects.slice(0, TABLE_LIMIT);

  return (
    <div className="dash">
      <PageHeader
        title="Portfolio dashboard"
        subtitle={`${plural(snapshot.totalProjects, "project")} · last ${RANGE_LABEL[range]}`}
        actions={<RangeFilter value={range} />}
      />

      {/* KPI strip */}
      <div className="kpi-row">
        <div className="kpi-slot" data-tone="brand">
          <KpiCard
            label="Total projects"
            value={String(kpis.total)}
            icon={FolderKanban}
            tone="brand"
            note={`${kpis.createdInRange} created recently`}
          />
        </div>
        <div className="kpi-slot" data-tone="green">
          <KpiCard
            label="Active"
            value={String(kpis.active)}
            icon={Activity}
            tone="green"
            note={`${activeShare}% in delivery`}
          />
        </div>
        <div className="kpi-slot" data-tone="red">
          <KpiCard
            label="Overdue"
            value={String(kpis.overdue)}
            icon={AlertTriangle}
            tone="red"
            note={plural(kpis.overdueTasks, "overdue task")}
          />
        </div>
        <div className="kpi-slot" data-tone="amber">
          <KpiCard
            label="At risk"
            value={String(kpis.atRisk)}
            icon={ShieldAlert}
            tone="amber"
            note={plural(kpis.slippingPos, "slipping PO")}
          />
        </div>
        <div className="kpi-slot" data-tone="grey">
          <KpiCard
            label="Handed over"
            value={String(kpis.handedOver)}
            icon={PackageCheck}
            tone="grey"
            note={`${kpis.closed} fully closed`}
          />
        </div>
      </div>

      <div className="dash-grid">
        {/* Row 1: act now */}
        {needsAction.length ? (
          <ChartCard
            title="Needs action"
            subtitle={`${plural(needsAction.length, "item")} across the portfolio`}
            className="needs-card span-2"
          >
            <ul className="needs-list">
              {visibleNeeds.map((item) => (
                <li key={item.id}>
                  <Link
                    href={
                      item.href === "dashboard"
                        ? `/projects/${item.projectId}`
                        : `/projects/${item.projectId}/${item.href}`
                    }
                    className="needs-item"
                    data-severity={item.severity}
                  >
                    <div className="needs-copy">
                      <div className="needs-label">{item.label}</div>
                      <div className="needs-meta">{item.projectName}</div>
                    </div>
                    <span className={`needs-sev ${item.severity}`}>{item.severity}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {hiddenNeeds > 0 ? (
              <div className="dash-more">
                +{hiddenNeeds} more, most severe shown first
              </div>
            ) : null}
          </ChartCard>
        ) : null}

        <ChartCard
          title="Risk watch"
          subtitle="Projects with overdue work or slipping orders"
          className={needsAction.length ? "overdue-card" : "overdue-card span-full"}
        >
          {snapshot.overdueProjects.length ? (
            <ul className="dash-list">
              {snapshot.overdueProjects.map((row) => (
                <li key={row.id}>
                  <span className="dash-list-name">{row.name}</span>
                  {row.overdueTasks ? (
                    <span className="badge br">{row.overdueTasks} overdue</span>
                  ) : null}
                  {row.slippingPos ? (
                    <span className="badge ba">{row.slippingPos} slipping</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">No overdue projects.</div>
          )}
        </ChartCard>

        {/* Row 2: what's coming */}
        <ChartCard
          title="Upcoming deadlines"
          subtitle={`Next 14 days, ${plural(kpis.overdueTasks, "task")} already overdue`}
          className="deadline-card span-2"
        >
          {snapshot.deadlines.length ? (
            <div className="sc">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Due</th>
                    <th>Health</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.deadlines.map((row) => (
                    <tr key={row.id}>
                      <td>{row.project}</td>
                      <td>{row.task}</td>
                      <td>
                        <div>{row.dueLabel}</div>
                        <div className="dash-muted">
                          {row.daysLeft === 0 ? "today" : `in ${row.daysLeft}d`}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${row.badgeClass}`}>
                          {row.healthLabel}
                        </span>
                      </td>
                      <td style={{ minWidth: 130 }}>
                        <div className="prog">
                          <div className="prog-track">
                            <div
                              className="prog-fill"
                              style={{ width: `${Math.min(row.progress, 100)}%` }}
                            />
                          </div>
                          <span className="prog-value">{row.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty">All clear. Nothing due in the next 14 days.</div>
          )}
        </ChartCard>

        <ChartCard
          title="Recent activity"
          subtitle={`Last ${plural(snapshot.activity.length, "logged event")}`}
          className="activity-card"
        >
          {snapshot.activity.length ? (
            <ul className="feed">
              {snapshot.activity.map((entry) => (
                <li key={entry.id}>
                  <span className="feed-dot" />
                  <div>
                    <div className="feed-action">{entry.action}</div>
                    <div className="feed-meta">
                      {entry.userName} · {feedTime(entry.ts)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">No activity recorded yet.</div>
          )}
        </ChartCard>

        {/* Row 3: distribution */}
        <ChartCard
          title="Status mix"
          subtitle="Portfolio health across every project"
          className="donut-card"
        >
          <div className="donut-wrap">
            <StatusDonut data={snapshot.statusSlices} />
            <div className="donut-center">
              <span className="donut-total">{snapshot.totalProjects}</span>
              <span className="donut-caption">Projects</span>
            </div>
          </div>
          <div className="legend">
            {snapshot.statusSlices.map((slice) => (
              <span key={slice.key} className="legend-item">
                <span className="legend-dot" style={{ background: slice.color }} />
                <span>{slice.label}</span>
                <span className="legend-value">{slice.value}</span>
                <span className="legend-pct">{slice.percent}%</span>
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="Pipeline by stage"
          subtitle="Inception through to handover"
          className="pipeline-card span-2"
        >
          <PipelineChart data={snapshot.pipeline} />
        </ChartCard>

        {/* Row 4: trend */}
        <ChartCard
          title="Delivery trend"
          subtitle={`Created and handed over in the last ${RANGE_LABEL[range]}`}
          className="trend-card span-full"
        >
          <TrendChart data={snapshot.trend} />
          <div className="dash-foot">
            <span>
              <strong>{createdTotal}</strong> created
            </span>
            <span>
              <strong>{completedTotal}</strong> handed over
            </span>
            <span>
              Avg. progress <strong>{kpis.averageProgress}%</strong>
            </span>
            <span>
              Forecast margin <strong>{fmt(kpis.forecastMargin)}</strong>
            </span>
          </div>
        </ChartCard>

        {/* Row 5: full list, capped */}
        <ChartCard
          title="All projects"
          subtitle={
            projects.length > TABLE_LIMIT
              ? `Showing ${TABLE_LIMIT} of ${projects.length}`
              : `${projects.length} in the portfolio`
          }
          actions={
            projects.length > TABLE_LIMIT ? (
              <Link href="/projects" className="dash-link">
                View all projects
              </Link>
            ) : null
          }
          className="table-card span-full"
        >
          <ProjectTable projects={tableProjects} role={role} />
        </ChartCard>
      </div>
    </div>
  );
}
