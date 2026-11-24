import { Suspense } from "react";
import { NotesView } from "@/components/views/notes-view";
import { projectPageData } from "@/lib/project-page";

type SearchParams = Promise<{
  q?: string;
  project?: string;
  scope?: string;
  category?: string;
}>;

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: SearchParams;
}) {
  const { project } = await projectPageData(params);
  return (
    <NotesView
      searchParams={searchParams}
      selectedProjectId={project.id}
      projectId={project.id}
      projectName={project.name}
    />
  );
}

export default function ProjectNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}
