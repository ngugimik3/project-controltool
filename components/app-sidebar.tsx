"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/auth";
import { navGroups, projectIdFromPath } from "@/lib/navigation";
import type { Role } from "@/lib/roles";

export function AppSidebar({
  user,
  project,
}: {
  user: SessionUser;
  project?: { id: string; name: string } | null;
}) {
  const pathname = usePathname();
  const projectId = project?.id ?? projectIdFromPath(pathname);
  const inProject = Boolean(project && projectId);
  const groups = inProject
    ? navGroups("project", user.role as Role)
    : [
        ...navGroups("global", user.role as Role),
        ...navGroups("admin", user.role as Role),
      ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-3 px-3 pt-3 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Project Control"
              className="h-12 rounded-xl px-2 hover:bg-white/10 data-active:bg-transparent data-active:text-sidebar-foreground data-active:shadow-none"
            >
              <Link href="/dashboard">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
                  <Image
                    src="/images/ds-badge.png"
                    alt="Davis & Shirtliff"
                    width={28}
                    height={18}
                    priority
                  />
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span
                    className="truncate text-[15px] font-semibold tracking-tight text-white"
                    style={{ fontFamily: "var(--font-display), Outfit, sans-serif" }}
                  >
                    Project Control
                  </span>
                  <span className="truncate text-[11px] text-white/70">
                    Davis &amp; Shirtliff
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {inProject && project ? (
          <>
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="All projects">
                  <Link href="/projects">
                    <ArrowLeft />
                    <span>All projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="space-y-2 group-data-[collapsible=icon]:hidden">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="All projects"
                    className="h-8 text-white/75 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/projects">
                      <ArrowLeft />
                      <span>All projects</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-white/55 uppercase">
                  Current project
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-white">
                  {project.name}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SidebarHeader>

      <SidebarSeparator className="mx-3 bg-white/15" />

      <SidebarContent className="px-1 pt-1">
        <NavMain groups={groups} projectId={projectId} />
      </SidebarContent>

      <SidebarSeparator className="mx-3 bg-white/15" />

      <SidebarFooter className="px-2 pb-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
