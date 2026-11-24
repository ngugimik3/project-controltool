"use client";

import {
  deleteTaskAction,
  nextTaskStatusAction,
} from "@/lib/actions/task";
import { taskStatusLabel, todayISO } from "@/lib/planner";
import type { TaskView } from "@/lib/types";
import { useTaskSave } from "@/components/use-task-save";
import { ActionButton, ConfirmButton } from "./forms";

interface Dependency {
  id: string;
  name: string;
  status: number;
}

export function TaskRow({
  projectId,
  task,
  dependencies,
  canDelete,
}: {
  projectId: string;
  task: TaskView;
  dependencies: Dependency[];
  canDelete: boolean;
}) {
  const { values, setValues, save } = useTaskSave(projectId, task);

  const dependency = dependencies.find(
    (item) => item.id === values.dependsOnId,
  );

  return (
    <tr>
      <td>
        <input
          aria-label="Task"
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
          onBlur={(event) => save({ ...values, name: event.target.value })}
        />
        <select
          aria-label="Depends on"
          value={values.dependsOnId}
          style={{ marginTop: 4 }}
          onChange={(event) =>
            save({ ...values, dependsOnId: event.target.value })
          }
        >
          <option value="0">Runs in parallel (no dependency)</option>
          {dependencies.map((item) => (
            <option key={item.id} value={item.id}>
              After: {item.name}
            </option>
          ))}
        </select>
        {dependency && dependency.status !== 3 ? (
          <div className="warn">Waiting on {dependency.name}</div>
        ) : null}
        {task.status !== 3 && values.end < todayISO() ? (
          <div className="warn">Overdue</div>
        ) : null}
      </td>
      <td>
        <input
          aria-label="Role"
          list="task-roles"
          value={values.role}
          onChange={(event) =>
            setValues({ ...values, role: event.target.value })
          }
          onBlur={(event) => save({ ...values, role: event.target.value })}
        />
      </td>
      <td>
        <input
          aria-label="Owner"
          value={values.owner}
          placeholder="Assign person"
          onChange={(event) =>
            setValues({ ...values, owner: event.target.value })
          }
          onBlur={(event) => save({ ...values, owner: event.target.value })}
        />
      </td>
      <td>
        <input
          type="date"
          aria-label="Start"
          value={values.start}
          onChange={(event) => save({ ...values, start: event.target.value })}
        />
        <input
          type="date"
          aria-label="End"
          value={values.end}
          style={{ marginTop: 4 }}
          onChange={(event) => save({ ...values, end: event.target.value })}
        />
      </td>
      <td>
        <ActionButton
          action={nextTaskStatusAction}
          fields={{ projectId, taskId: task.id }}
          label={taskStatusLabel(task.status)}
          className="btn bts"
        />
      </td>
      <td>
        {canDelete ? (
          <ConfirmButton
            action={deleteTaskAction}
            fields={{ projectId, taskId: task.id }}
            label="Del"
            confirm="Delete this task?"
          />
        ) : null}
      </td>
    </tr>
  );
}
