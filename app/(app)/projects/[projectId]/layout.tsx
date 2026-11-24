import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { requireProjectAccess } from "@/lib/access";
import { getProjectById } from "@/lib/data";

async function ProjectShell({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireProjectAccess(projectId);
  const project = await getProjectById(projectId);
  if (!project) notFound();

  return (
    <AppShell user={user} project={project}>
      {children}
    </AppShell>
  );
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <ProjectShell params={params}>{children}</ProjectShell>
    </Suspense>
  );
}
