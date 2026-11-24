"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTaskAction } from "@/lib/actions/task";
import type { TaskView } from "@/lib/types";
import { toast } from "@/components/toast";

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

type TaskSaveState = { key: string; saved: TaskDraft; values: TaskDraft };

export function useTaskSave(projectId: string, task: TaskView) {
  const router = useRouter();
  const key = taskKey(task);
  const [state, setState] = useState<TaskSaveState>(() => ({
    key,
    saved: draftFromTask(task),
    values: draftFromTask(task),
  }));
  const [pending, startTransition] = useTransition();

  // A refreshed task gets a new key, so the draft resets to the server values
  // without an effect writing state during render.
  const current: TaskSaveState =
    state.key === key
      ? state
      : { key, saved: draftFromTask(task), values: draftFromTask(task) };

  function setValues(next: TaskDraft) {
    setState({ ...current, values: next });
  }

  function save(next: TaskDraft) {
    const { saved } = current;
    setValues(next);
    if (
      next.name === saved.name &&
      next.role === saved.role &&
      next.owner === saved.owner &&
      next.start === saved.start &&
      next.end === saved.end &&
      next.dependsOnId === saved.dependsOnId
    ) {
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

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("taskId", task.id);
    formData.set("name", next.name);
    formData.set("role", next.role);
    formData.set("owner", next.owner);
    formData.set("start", next.start);
    formData.set("end", next.end);
    formData.set("dependsOnId", next.dependsOnId);

    startTransition(async () => {
      const result = await saveTaskAction(formData);
      if (result.error) {
        toast(result.error);
        setValues(saved);
        return;
      }
      setState({ ...current, saved: next, values: next });
      router.refresh();
    });
  }

  return { values: current.values, setValues, save, pending };
}
