import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { TABS, TL } from "@/lib/constants";
import { getProjectOptions, getSelectedProject } from "@/lib/data";
import { ROLE_LABEL } from "@/lib/roles";
import { fmt, progress } from "@/lib/planner";
import { Tabs } from "@/components/tabs";
import { ProjectSelector } from "@/components/project-selector";
import { GateBar } from "@/components/gate-bar";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [projects, selected] = await Promise.all([
    getProjectOptions(),
    getSelectedProject(),
  ]);
  const tabs = TABS.filter((tab) => tab !== "admin" || user.role !== "user").map(
    (tab) => ({ key: tab, label: TL[tab] }),
  );

  return (
    <div className="app" id="app" data-role={user.role}>
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">
            <Image
              src="/images/ds-badge.png"
              alt="Davis & Shirtliff"
              width={44}
              height={29}
              priority
            />
          </span>
          <span className="brand-text">
            <span className="brand-name">Project Control</span>
            <span className="brand-sub">Davis &amp; Shirtliff</span>
          </span>
        </Link>
        <div className="sidebar-project">
          <label className="sidebar-label" htmlFor="sel">
            Project
          </label>
          <ProjectSelector
            projects={projects.map((project) => ({ id: project.id, name: project.name }))}
            selectedId={selected?.id ?? null}
          />
        </div>
        <Tabs tabs={tabs} />
        <div className="sidebar-foot">
          <form action={logoutAction}>
            <button type="submit" className="user-badge" title="Click to log out">
              <span className="user-avatar">{initials(user.name)}</span>
              <span className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{ROLE_LABEL[user.role]}</span>
              </span>
            </button>
          </form>
        </div>
      </aside>
      <div className="app-body">
        <div className="page-meta" id="meta">
          {selected
            ? `${selected.client} · ${selected.type} · value ${fmt(selected.contract)} · ${progress(selected)}% complete`
            : "No project selected"}
        </div>
        <main className="app-main">
          <GateBar project={selected} role={user.role} />
          <div id="view">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
