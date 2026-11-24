"use client";

import { useActionState, useEffect, useRef } from "react";
import { NotebookPen, Send } from "lucide-react";
import { saveNote, type NoteState } from "@/lib/notes-actions";
import { ENGINEER_CATEGORIES, CATEGORY_LABELS } from "@/lib/note-categories";

export function NoteComposer({
  projects,
  defaultProjectId,
  lockProject,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
  lockProject?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: NoteState, formData: FormData) => {
      const next = await saveNote(prev, formData);
      if (next.ok) formRef.current?.reset();
      return next;
    },
    {} as NoteState,
  );

  useEffect(() => {
    if (!state.ok || !formRef.current || !defaultProjectId) return;
    const select = formRef.current.elements.namedItem(
      "projectId",
    ) as HTMLSelectElement | null;
    if (select) select.value = defaultProjectId;
  }, [state.ok, defaultProjectId]);

  return (
    <section className="note-composer card">
      <div className="note-composer-head">
        <div className="note-composer-icon" aria-hidden>
          <NotebookPen size={18} />
        </div>
        <div>
          <h2 className="note-composer-title">Engineer notebook</h2>
          <p className="note-composer-sub">
            Capture site observations, design calls, and decisions — separate from module logs.
          </p>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="note-composer-form">
        <textarea
          name="body"
          rows={3}
          required
          placeholder="What happened on site, what was decided, or what needs follow-up…"
          className="note-composer-input"
        />
        <div className="note-composer-toolbar">
          <label className="note-composer-field">
            <span>Type</span>
            <select name="category" defaultValue="SITE">
              {ENGINEER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          {lockProject && defaultProjectId ? (
            <input type="hidden" name="projectId" value={defaultProjectId} />
          ) : (
            <label className="note-composer-field">
              <span>Project</span>
              <select name="projectId" defaultValue={defaultProjectId ?? ""}>
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" className="btn btp note-composer-submit" disabled={pending}>
            <Send size={15} />
            {pending ? "Saving…" : "Add note"}
          </button>
        </div>
        {state.error ? <p className="field-error">{state.error}</p> : null}
      </form>
    </section>
  );
}
