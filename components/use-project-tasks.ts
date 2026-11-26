"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProjectTasksAction } from "@/lib/actions/task";
import type { TaskView } from "@/lib/types";

export const taskKeys = {
  all: ["tasks"] as const,
  project: (projectId: string) => [...taskKeys.all, "project", projectId] as const,
};

/**
 * Reads the project's tasks from the query cache, seeded with the server-rendered
 * list. Mutations update this cache optimistically and invalidate it on success.
 */
export function useProjectTasks(projectId: string, initialTasks: TaskView[]) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: taskKeys.project(projectId),
    queryFn: () => getProjectTasksAction(projectId),
    initialData: initialTasks,
  });

  // Keep the cache in sync when the server sends a refreshed list.
  useEffect(() => {
    queryClient.setQueryData(taskKeys.project(projectId), initialTasks);
  }, [queryClient, projectId, initialTasks]);

  return query;
}
