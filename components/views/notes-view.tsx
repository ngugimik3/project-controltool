import { Suspense } from "react";
import { headers } from "next/headers";
import { HardHat, NotebookPen, Pin, PinOff, Trash2, Wrench } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { PageHeader } from "@/components/page-header";
import { NoteComposer } from "@/components/notes/note-composer";
import { NoteDialog } from "@/components/notes/note-dialog";
import { auth } from "@/lib/auth";
import {
  CATEGORIES,
  ENGINEER_CATEGORIES,
  MODULE_CATEGORIES,
  categoriesForScope,
  labelFor,
  type NoteCategoryValue,
  type NoteScope,
} from "@/lib/note-categories";
import { deleteNote, togglePin } from "@/lib/notes-actions";
import { prisma } from "@/lib/prisma";

const TZ = "Africa/Nairobi";

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const timeOf = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

function dayLabel(key: string, now: Date) {
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(yesterday)) return "Yesterday";
  return new Date(key + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseScope(raw?: string): NoteScope {
  if (raw === "engineer" || raw === "modules") return raw;
  return "all";
}

type SearchParams = Promise<{
  project?: string;
  category?: string;
  q?: string;
  scope?: string;
}>;

export function NotesView({
  searchParams,
  selectedProjectId,
  projectId,
  projectName,
}: {
  searchParams: SearchParams;
  selectedProjectId?: string | null;
  projectId?: string;
  projectName?: string;
}) {
  return (
    <div className="notes-view view-stack">
      <PageHeader
        title="Notes"
        subtitle={
          projectId
            ? `${projectName ?? "Project"} · engineer notebook and module logs`
            : "Engineer notebook and module logs across your projects"
        }
      />
      <Suspense fallback={<Skeleton />}>
        <NotesContent
          searchParams={searchParams}
          selectedProjectId={selectedProjectId}
          projectId={projectId}
        />
      </Suspense>
    </div>
  );
}

async function NotesContent({
  searchParams,
  selectedProjectId,
  projectId,
}: {
  searchParams: SearchParams;
  selectedProjectId?: string | null;
  projectId?: string;
}) {
  const sp = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <p className="empty">Please sign in.</p>;

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "superadmin";
  const projectFilter = projectId
    ? projectId
    : sp.project !== undefined
      ? sp.project
      : (selectedProjectId ?? "");
  const basePath = projectId ? `/projects/${projectId}/notes` : "/notes";
  const scope = parseScope(sp.scope);
  const scopeCats = categoriesForScope(scope);
  const categoryOk =
    sp.category && (CATEGORIES as readonly string[]).includes(sp.category)
      ? (sp.category as NoteCategoryValue)
      : undefined;
  const categoryFilter =
    categoryOk && (scopeCats as readonly string[]).includes(categoryOk)
      ? categoryOk
      : undefined;

  const where: Prisma.ProjectNoteWhereInput = {
    ...(projectFilter ? { projectId: projectFilter } : {}),
    ...(categoryFilter
      ? { category: categoryFilter }
      : scope === "all"
        ? {}
        : { category: { in: [...scopeCats] } }),
    ...(sp.q
      ? {
          OR: [
            { title: { contains: sp.q, mode: "insensitive" } },
            { body: { contains: sp.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [notes, projects] = await Promise.all([
    prisma.projectNote.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.project.findMany({
      where: projectId ? { id: projectId } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();
  const pinned = notes.filter((n) => n.pinned);
  const groups = new Map<string, typeof notes>();
  for (const n of notes.filter((n) => !n.pinned)) {
    const k = dayKey(n.createdAt);
    groups.set(k, [...(groups.get(k) ?? []), n]);
  }

  const filterHref = (next: {
    scope?: NoteScope;
    category?: string;
    project?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams();
    const nextScope = next.scope ?? scope;
    if (nextScope !== "all") params.set("scope", nextScope);
    const nextCat = next.category !== undefined ? next.category : (categoryFilter ?? "");
    if (nextCat) params.set("category", nextCat);
    const nextProject = next.project !== undefined ? next.project : projectFilter;
    if (nextProject) params.set("project", nextProject);
    const nextQ = next.q !== undefined ? next.q : (sp.q ?? "");
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const renderNote = (n: (typeof notes)[number]) => {
    const canEdit = n.createdById === session.user.id || isAdmin;
    const edited = n.updatedAt.getTime() - n.createdAt.getTime() > 1000;
    const isModule = (MODULE_CATEGORIES as readonly string[]).includes(n.category);
    return (
      <article key={n.id} className={`note-card${isModule ? " note-card-module" : ""}`}>
        <div className="note-card-body">
          <div className="grow" style={{ marginBottom: 4 }}>
            <span className={`note-cat note-cat-${n.category}`}>{labelFor(n.category)}</span>
            {n.project ? <span className="note-card-meta">{n.project.name}</span> : null}
          </div>
          {n.title ? <div className="note-card-title">{n.title}</div> : null}
          <p className="note-card-text">{n.body}</p>
          <p className="note-card-meta">
            {n.createdBy.name} · {dayLabel(dayKey(n.createdAt), now)}, {timeOf(n.createdAt)}
            {edited ? ` · edited ${timeOf(n.updatedAt)}` : ""}
          </p>
        </div>
        {canEdit ? (
          <div className="note-card-actions">
            <form action={togglePin.bind(null, n.id)}>
              <button className="btn bts" type="submit" aria-label="Pin" title="Pin">
                {n.pinned ? <PinOff size={15} /> : <Pin size={15} />}
              </button>
            </form>
            <NoteDialog
              projects={projects}
              defaultProjectId={projectFilter || undefined}
              lockProject={Boolean(projectId)}
              note={{
                id: n.id,
                title: n.title,
                body: n.body,
                category: n.category as NoteCategoryValue,
                projectId: n.projectId,
              }}
            />
            <form action={deleteNote.bind(null, n.id)}>
              <button className="btn btd" type="submit" aria-label="Delete" title="Delete">
                <Trash2 size={15} />
              </button>
            </form>
          </div>
        ) : null}
      </article>
    );
  };

  const emptyCopy =
    scope === "modules"
      ? {
          title: "No module notes yet",
          sub: "Use Detailed note for procurement, suppliers, quotations, and deliveries.",
        }
      : scope === "engineer"
        ? {
            title: "No engineer notes yet",
            sub: "Jot a site observation or decision in the notebook above.",
          }
        : {
            title: "No notes yet",
            sub: "Start with the engineer notebook, or add a detailed module note.",
          };

  return (
    <>
      <NoteComposer
        projects={projects}
        defaultProjectId={projectFilter || undefined}
        lockProject={Boolean(projectId)}
      />

      <div className="card notes-panel">
        <div className="notes-scope" role="tablist" aria-label="Note scope">
          <a
            href={filterHref({ scope: "all", category: "" })}
            className={`notes-scope-chip${scope === "all" ? " active" : ""}`}
            role="tab"
            aria-selected={scope === "all"}
          >
            All notes
          </a>
          <a
            href={filterHref({ scope: "engineer", category: "" })}
            className={`notes-scope-chip${scope === "engineer" ? " active" : ""}`}
            role="tab"
            aria-selected={scope === "engineer"}
          >
            <HardHat size={14} />
            Engineer
          </a>
          <a
            href={filterHref({ scope: "modules", category: "" })}
            className={`notes-scope-chip${scope === "modules" ? " active" : ""}`}
            role="tab"
            aria-selected={scope === "modules"}
          >
            <Wrench size={14} />
            Modules
          </a>
        </div>

        <div className="notes-filters">
          <form action={basePath} className="notes-filters" style={{ flex: 1 }}>
            {scope !== "all" ? <input type="hidden" name="scope" value={scope} /> : null}
            <label>
              Search
              <input name="q" defaultValue={sp.q} placeholder="Search notes..." />
            </label>
            {projectId ? (
              <input type="hidden" name="project" value={projectId} />
            ) : (
              <label>
                Project
                <select name="project" defaultValue={projectFilter}>
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Category
              <select name="category" defaultValue={categoryFilter ?? ""}>
                <option value="">All categories</option>
                {(scope === "modules"
                  ? MODULE_CATEGORIES
                  : scope === "engineer"
                    ? ENGINEER_CATEGORIES
                    : CATEGORIES
                ).map((c) => (
                  <option key={c} value={c}>
                    {labelFor(c)}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btg" type="submit">
              Filter
            </button>
          </form>
          <NoteDialog
            projects={projects}
            defaultProjectId={projectFilter || undefined}
            defaultCategory={scope === "modules" ? "PROCUREMENT" : "SITE"}
            lockProject={Boolean(projectId)}
          />
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="empty">
          <NotebookPen size={28} style={{ margin: "0 auto 8px", color: "var(--tm)" }} />
          <div>{emptyCopy.title}</div>
          <p className="sub">{emptyCopy.sub}</p>
        </div>
      ) : (
        <div>
          {pinned.length > 0 ? (
            <section>
              <div className="notes-day">Pinned</div>
              {pinned.map(renderNote)}
            </section>
          ) : null}
          {[...groups.entries()].map(([key, list]) => (
            <section key={key}>
              <div className="notes-day">{dayLabel(key, now)}</div>
              {list.map(renderNote)}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="view-stack">
      <div className="sk" style={{ height: 168 }} />
      {[0, 1, 2].map((i) => (
        <div key={i} className="sk" style={{ height: 96 }} />
      ))}
    </div>
  );
}
