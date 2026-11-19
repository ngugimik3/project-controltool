import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { TABS, TL } from "@/lib/constants";
import { getActivity, getProjects, getSelectedProject, getSettings, getUsers } from "@/lib/data";
import { parseRange, type RangeKey } from "@/lib/dashboard";
import { ProjectsView } from "@/components/views/projects-view";
import { DashboardSection } from "@/components/views/dashboard-view";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { SurveyView } from "@/components/views/survey-view";
import { ScheduleView } from "@/components/views/schedule-view";
import { ProcurementView } from "@/components/views/procurement-view";
import { FatView } from "@/components/views/fat-view";
import { NotesView } from "@/components/views/notes-view";
import { HandoverView } from "@/components/views/handover-view";
import { CostingView } from "@/components/views/costing-view";
import { AdminView } from "@/components/views/admin-view";
import {
  CommissioningView,
  InstallView,
  SatView,
  SupportView,
  TrainingView,
} from "@/components/views/phase-views";

function EmptyProject() {
  return (
    <div className="view-stack">
      <div className="card">
        <div className="ct">No project selected</div>
        <p className="sub">Choose a project in the sidebar, or create one on the Projects tab.</p>
      </div>
    </div>
  );
}

async function TabContent({
  tab,
  range,
  query,
}: {
  tab: string;
  range: RangeKey;
  query: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();

  if (!(TABS as readonly string[]).includes(tab)) notFound();
  if (tab === "admin" && user.role === "user") redirect("/dashboard");

  if (tab === "dashboard") {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardSection range={range} role={user.role} />
      </Suspense>
    );
  }

  if (tab === "survey") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <SurveyView project={project} role={user.role} />;
  }

  if (tab === "schedule") {
    const [project, settings] = await Promise.all([getSelectedProject(), getSettings()]);
    if (!project) return <EmptyProject />;
    return <ScheduleView project={project} settings={settings} role={user.role} />;
  }

  if (tab === "procurement") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <ProcurementView project={project} role={user.role} />;
  }

  if (tab === "notes") {
    const selected = await getSelectedProject();
    const sp = {
      q: typeof query.q === "string" ? query.q : undefined,
      project: typeof query.project === "string" ? query.project : undefined,
      category: typeof query.category === "string" ? query.category : undefined,
      scope: typeof query.scope === "string" ? query.scope : undefined,
    };
    return (
      <NotesView
        searchParams={Promise.resolve(sp)}
        selectedProjectId={selected?.id ?? null}
      />
    );
  }

  if (tab === "fat") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <FatView project={project} role={user.role} />;
  }

  if (tab === "install") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <InstallView project={project} role={user.role} />;
  }

  if (tab === "commis") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <CommissioningView project={project} role={user.role} />;
  }

  if (tab === "sat") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <SatView project={project} role={user.role} />;
  }

  if (tab === "training") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <TrainingView project={project} role={user.role} />;
  }

  if (tab === "support") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <SupportView project={project} role={user.role} />;
  }

  if (tab === "handover") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <HandoverView project={project} />;
  }

  if (tab === "costing") {
    const project = await getSelectedProject();
    if (!project) return <EmptyProject />;
    return <CostingView project={project} role={user.role} />;
  }

  if (tab === "admin") {
    const [settings, users, activity] = await Promise.all([
      getSettings(),
      getUsers(),
      getActivity(),
    ]);
    return <AdminView role={user.role} settings={settings} users={users} activity={activity} />;
  }

  if (tab === "projects") {
    const [project, projects, settings] = await Promise.all([
      getSelectedProject(),
      getProjects(),
      getSettings(),
    ]);
    return (
      <ProjectsView
        project={project}
        projects={projects}
        settings={settings}
        role={user.role}
      />
    );
  }

  return (
    <div className="card">
      <div className="ct">{TL[tab as keyof typeof TL]}</div>
      <p className="sub">This tab is built in a later step.</p>
    </div>
  );
}

export default function TabPage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <TabResolver params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function TabResolver({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const [{ tab }, query] = await Promise.all([params, searchParams]);
  return <TabContent tab={tab} range={parseRange(query.range)} query={query} />;
}
