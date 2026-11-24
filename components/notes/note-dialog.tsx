"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { saveNote, type NoteState } from "@/lib/notes-actions";
import {
  ENGINEER_CATEGORIES,
  MODULE_CATEGORIES,
  CATEGORY_LABELS,
  type NoteCategoryValue,
} from "@/lib/note-categories";

export type NoteData = {
  id: string;
  title: string | null;
  body: string;
  category: NoteCategoryValue;
  projectId: string | null;
};

export function NoteDialog({
  projects,
  note,
  defaultProjectId,
  defaultCategory = "GENERAL",
  lockProject,
}: {
  projects: { id: string; name: string }[];
  note?: NoteData;
  defaultProjectId?: string;
  defaultCategory?: NoteCategoryValue;
  lockProject?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: NoteState, formData: FormData) => {
      const next = await saveNote(prev, formData);
      if (next.ok) setOpen(false);
      return next;
    },
    {} as NoteState,
  );

  return (
    <>
      {note ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn bts"
          aria-label="Edit note"
        >
          <Pencil size={15} />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn btp">
          <Plus size={16} /> Detailed note
        </button>
      )}

      {open ? (
        <div
          className="note-modal-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="note-modal card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-dialog-title"
          >
            <div className="gate-head" style={{ marginBottom: 14 }}>
              <h2 id="note-dialog-title" className="ct" style={{ marginBottom: 0 }}>
                {note ? "Edit note" : "New note"}
              </h2>
              <button
                type="button"
                className="btn btg"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form action={formAction} className="stack-form" style={{ maxWidth: "none" }}>
              {note ? <input type="hidden" name="id" value={note.id} /> : null}
              <label>
                Title
                <input
                  name="title"
                  placeholder="Title (optional)"
                  defaultValue={note?.title ?? ""}
                />
              </label>
              <div className="f">
                <label>
                  Category
                  <select
                    name="category"
                    defaultValue={note?.category ?? defaultCategory}
                  >
                    <optgroup label="Engineer">
                      {ENGINEER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Modules">
                      {MODULE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <label>
                  Project
                  {lockProject && (note?.projectId ?? defaultProjectId) ? (
                    <input
                      type="hidden"
                      name="projectId"
                      value={note?.projectId ?? defaultProjectId ?? ""}
                    />
                  ) : (
                    <select
                      name="projectId"
                      defaultValue={note?.projectId ?? defaultProjectId ?? ""}
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              </div>
              <label>
                Note
                <textarea
                  name="body"
                  rows={5}
                  required
                  placeholder="Write your note…"
                  defaultValue={note?.body ?? ""}
                />
              </label>
              {state.error ? <p className="field-error">{state.error}</p> : null}
              <div className="profile-form-actions">
                <button type="submit" className="btn btp" disabled={pending}>
                  {pending ? "Saving…" : note ? "Save changes" : "Create note"}
                </button>
                <button
                  type="button"
                  className="btn btg"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
