"use client";

import { useTransition } from "react";
import { selectProjectAction } from "@/lib/actions/project";
import { toast } from "./toast";

export function ProjectSelector({
  projects,
  selectedId,
}: {
  projects: { id: string; name: string }[];
  selectedId: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      id="sel"
      aria-label="Project"
      value={selectedId ?? ""}
      disabled={pending || projects.length === 0}
      onChange={(event) => {
        const id = event.target.value;
        startTransition(async () => {
          const result = await selectProjectAction(id);
          if (result.error) toast(result.error);
        });
      }}
    >
      {projects.length === 0 ? <option value="">No projects</option> : null}
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
