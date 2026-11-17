"use client";

import { useState, useTransition } from "react";
import { deleteParamAction, updateParamAction } from "@/lib/actions/project";
import { PARAM_GROUPS } from "@/lib/defaults";
import type { ParamView } from "@/lib/types";
import { ActionButton } from "./forms";
import { toast } from "./toast";

export function ParamRow({
  projectId,
  param,
  canDelete,
}: {
  projectId: string;
  param: ParamView;
  canDelete: boolean;
}) {
  const [values, setValues] = useState({
    groupName: param.groupName,
    name: param.name,
    value: param.value,
    unit: param.unit,
  });
  const [, startTransition] = useTransition();

  function save(next: typeof values) {
    setValues(next);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("paramId", param.id);
    formData.set("groupName", next.groupName);
    formData.set("name", next.name);
    formData.set("value", next.value);
    formData.set("unit", next.unit);
    startTransition(async () => {
      const result = await updateParamAction(formData);
      if (result.error) toast(result.error);
    });
  }

  return (
    <tr>
      <td>
        <select
          aria-label="Group"
          value={values.groupName}
          onChange={(event) => save({ ...values, groupName: event.target.value })}
        >
          {PARAM_GROUPS.map((group) => (
            <option key={group}>{group}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          aria-label="Parameter"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          onBlur={() => save(values)}
        />
      </td>
      <td>
        <input
          aria-label="Value"
          value={values.value}
          onChange={(event) => setValues({ ...values, value: event.target.value })}
          onBlur={() => save(values)}
        />
      </td>
      <td>
        <input
          aria-label="Unit"
          value={values.unit}
          style={{ maxWidth: 80 }}
          onChange={(event) => setValues({ ...values, unit: event.target.value })}
          onBlur={() => save(values)}
        />
      </td>
      <td>
        {canDelete ? (
          <ActionButton
            action={deleteParamAction}
            fields={{ projectId, paramId: param.id }}
            label="Del"
          />
        ) : null}
      </td>
    </tr>
  );
}
