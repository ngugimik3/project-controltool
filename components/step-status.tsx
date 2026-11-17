"use client";

import { useState, useTransition } from "react";
import { setCheckStatusAction } from "@/lib/actions/checklist";
import { TASK_STATUS } from "@/lib/constants";
import { toast } from "./toast";

export function StepStatus({
  projectId,
  itemId,
  status,
}: {
  projectId: string;
  itemId: string;
  status: number;
}) {
  const [value, setValue] = useState(status);
  const [, startTransition] = useTransition();

  function onChange(next: number) {
    const previous = value;
    setValue(next);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("itemId", itemId);
    formData.set("status", String(next));
    startTransition(async () => {
      const result = await setCheckStatusAction(formData);
      if (result.error) {
        toast(result.error);
        setValue(previous);
      }
    });
  }

  return (
    <select
      aria-label="Status"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      {TASK_STATUS.map((label, index) => (
        <option key={label} value={index}>
          {label}
        </option>
      ))}
    </select>
  );
}
