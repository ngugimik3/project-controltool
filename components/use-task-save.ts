"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveTaskAction } from "@/lib/actions/task";
import type { TaskView } from "@/lib/types";
import { toast } from "@/components/toast";
import { taskKeys } from "@/components/use-project-tasks";

export type TaskDraft = {
  name: string;
  role: string;
  owner: string;
  start: string;
  end: string;
  dependsOnId: string;
};

function draftFromTask(task: TaskView): TaskDraft {
  return {
    name: task.name,
    role: task.role,
    owner: task.owner,
    start: task.startDate,
    end: task.endDate,
    dependsOnId: task.dependsOnId ?? "0",
  };
}

/** Changes whenever the server copy of the task changes. */
function taskKey(task: TaskView): string {
  return [
    task.id,
    task.name,
    task.role,
    task.owner,
    task.startDate,
    task.endDate,
    task.dependsOnId ?? "0",
  ].join("\u0000");
}

function sameDraft(a: TaskDraft, b: TaskDraft): boolean {
  return (
    a.name === b.name &&
    a.role === b.role &&
    a.owner === b.owner &&
    a.start === b.start &&
    a.end === b.end &&
    a.dependsOnId === b.dependsOnId
  );
}

function applyDraft(task: TaskView, draft: TaskDraft): TaskView {
  return {
    ...task,
    name: draft.name,
    role: draft.role,
    owner: draft.owner,
    startDate: draft.start,
    endDate: draft.end,
    dependsOnId: draft.dependsOnId === "0" ? null : draft.dependsOnId,
  };
}

type TaskSaveState = { key: string; saved: TaskDraft; values: TaskDraft };

export function useTaskSave(projectId: string, task: TaskView) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const key = taskKey(task);
  const [state, setState] = useState<TaskSaveState>(() => ({
    key,
    saved: draftFromTask(task),
    values: draftFromTask(task),
  }));

  // A refreshed task gets a new key, so the draft resets to the server values
  // without an effect writing state during render.
  const current: TaskSaveState =
    state.key === key
      ? state
      : { key, saved: draftFromTask(task), values: draftFromTask(task) };

  function setValues(next: TaskDraft) {
    setState((prev) =>
      prev.key === key
        ? { ...prev, values: next }
        : { key, saved: draftFromTask(task), values: next },
    );
  }

  const mutation = useMutation({
    mutationKey: ["task-save", projectId, task.id],
    // Saves for one task run in order, so a slow response cannot roll back a
    // newer edit with an older snapshot.
    scope: { id: `task-save:${projectId}:${task.id}` },
    mutationFn: async (next: TaskDraft) => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("taskId", task.id);
      formData.set("name", next.name);
      formData.set("role", next.role);
      formData.set("owner", next.owner);
      formData.set("start", next.start);
      formData.set("end", next.end);
      formData.set("dependsOnId", next.dependsOnId);

      const result = await saveTaskAction(formData);
      if (result.error) throw new Error(result.error);
      return next;
    },
    onMutate: async (next) => {
      const queryKey = taskKeys.project(projectId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TaskView[]>(queryKey);
      if (previous) {
        queryClient.setQueryData<TaskView[]>(
          queryKey,
          previous.map((item) =>
            item.id === task.id ? applyDraft(item, next) : item,
          ),
        );
      }
      return { previous };
    },
    onError: (error, failed, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          taskKeys.project(projectId),
          context.previous,
        );
      }
      toast(error instanceof Error ? error.message : "Could not save the task.");
      // Revert the rejected draft, but keep anything typed while it was saving.
      setState((prev) => ({
        ...prev,
        values: sameDraft(prev.values, failed) ? prev.saved : prev.values,
      }));
    },
    onSuccess: (next) => {
      setState((prev) => ({
        ...prev,
        saved: next,
        values: sameDraft(prev.values, next) ? next : prev.values,
      }));
      void queryClient.invalidateQueries({
        queryKey: taskKeys.project(projectId),
      });
      router.refresh();
    },
  });

  function save(next: TaskDraft) {
    const { saved } = current;
    setValues(next);
    if (sameDraft(next, saved)) {
      return;
    }
    if (!next.name.trim()) {
      toast("Task name is required.");
      setValues(saved);
      return;
    }
    if (next.end < next.start) {
      toast("The end date cannot be before the start date.");
      setValues(saved);
      return;
    }

    mutation.mutate(next);
  }

  return {
    values: current.values,
    setValues,
    save,
    pending: mutation.isPending,
  };
}
