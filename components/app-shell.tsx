import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { GateBar } from "@/components/gate-bar";
import { ProjectChips } from "@/components/project-chips";
import { QueryProvider } from "@/components/query-provider";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SessionUser } from "@/lib/auth";
import type { ProjectView } from "@/lib/types";

export function AppShell({
  user,
  project,
  children,
}: {
  user: SessionUser;
  project?: ProjectView | null;
  children: ReactNode;
}) {
  return (
    <QueryProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar
            user={user}
            project={project ? { id: project.id, name: project.name } : null}
          />
          <SidebarInset className="bg-transparent">
            <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-[var(--bd)] bg-white/90 px-4 backdrop-blur-md">
              <SidebarTrigger className="rounded-lg text-[var(--ts)] hover:bg-[var(--blue-soft)] hover:text-[var(--blue-dark)]" />
              <Separator orientation="vertical" className="mr-1 h-5 bg-[var(--bd)]" />
              {project ? (
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href="/projects"
                    className="flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--blue-dark)] hover:underline"
                  >
                    <ArrowLeft className="size-4" />
                    All projects
                  </Link>
                  <span className="text-[var(--bds)]">/</span>
                  <span className="truncate text-sm font-semibold text-[var(--tp)]">
                    {project.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-semibold text-[var(--tp)]">
                  Project Control
                </span>
              )}
              {project ? (
                <div className="ml-auto hidden min-w-0 lg:block">
                  <ProjectChips project={project} />
                </div>
              ) : null}
            </header>
            <main className="app-main">
              {project ? (
                <GateBar project={project} role={user.role} />
              ) : null}
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
