import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { TABS, TL } from "@/lib/constants";
import { getProjectOptions, getSelectedProject } from "@/lib/data";
import { Tabs } from "@/components/tabs";
import { ProjectSelector } from "@/components/project-selector";
import { GateBar } from "@/components/gate-bar";
import { UserMenu } from "@/components/profile/user-menu";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ProjectChips } from "@/components/project-chips";

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const sidebarOpen = (await cookies()).get("sidebar")?.value !== "closed";
  const [projects, selected] = await Promise.all([
    getProjectOptions(),
    getSelectedProject(),
  ]);
  const tabs = TABS.filter((tab) => tab !== "admin" || user.role !== "user").map(
    (tab) => ({ key: tab, label: TL[tab] }),
  );

  return (
    <div
      className="app"
      id="app"
      data-role={user.role}
      data-sidebar={sidebarOpen ? "open" : "closed"}
    >
      <aside className="sidebar" id="sidebar">
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
            <button type="submit" className="sidebar-signout" title="Sign out">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <div className="app-body">
        <div className="topbar">
          <SidebarToggle defaultOpen={sidebarOpen} />
          <ProjectChips project={selected} />
          <UserMenu name={user.name} role={user.role} avatarUrl={user.avatarUrl} />
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
