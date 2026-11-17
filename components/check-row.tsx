"use client";

import { useState, useTransition } from "react";
import {
  deleteCheckItemAction,
  setCheckResultAction,
  updateCheckItemAction,
} from "@/lib/actions/checklist";
import { isTestKind } from "@/lib/planner";
import type { CheckItemView } from "@/lib/types";
import { ActionButton } from "./forms";
import { AttachmentStrip } from "./attachments";
import { toast } from "./toast";

export function CheckRow({
  projectId,
  item,
  canDelete,
  locked,
}: {
  projectId: string;
  item: CheckItemView;
  canDelete: boolean;
  locked?: boolean;
}) {
  const [row, setRow] = useState({
    item: item.item,
    reading: item.reading,
    note: item.note,
    result: item.result,
  });
  const [, startTransition] = useTransition();
  const test = isTestKind(item.kind);

  function saveText(field: "item" | "reading" | "note", value: string) {
    if (value === item[field]) return;
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("itemId", item.id);
    formData.set("field", field);
    formData.set("value", value);
    startTransition(async () => {
      const result = await updateCheckItemAction(formData);
      if (result.error) toast(result.error);
    });
  }

  function setResult(result: "Pass" | "Fail" | "NA") {
    if (locked) return;
    const previous = row.result;
    setRow((current) => ({ ...current, result }));
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("itemId", item.id);
    formData.set("result", result);
    startTransition(async () => {
      const response = await setCheckResultAction(formData);
      if (response.error) {
        toast(response.error);
        setRow((current) => ({ ...current, result: previous }));
      }
    });
  }

  return (
    <tr>
      <td>
        <input
          aria-label="Item"
          value={row.item}
          disabled={locked}
          onChange={(event) => setRow({ ...row, item: event.target.value })}
          onBlur={(event) => saveText("item", event.target.value)}
        />
      </td>
      <td>
        <input
          aria-label="Reading or detail"
          value={row.reading}
          disabled={locked}
          onChange={(event) => setRow({ ...row, reading: event.target.value })}
          onBlur={(event) => saveText("reading", event.target.value)}
        />
      </td>
      <td>
        <div className="grow" style={{ marginBottom: 0, flexWrap: "nowrap" }}>
          <button
            type="button"
            className={`btn ${row.result === "Pass" ? "ok" : "btg"}`}
            disabled={locked}
            onClick={() => setResult("Pass")}
          >
            {test ? "Pass" : "Done"}
          </button>
          <button
            type="button"
            className={`btn ${row.result === "Fail" ? "bad" : "btg"}`}
            disabled={locked}
            onClick={() => setResult("Fail")}
          >
            Fail
          </button>
          {test ? null : (
            <button
              type="button"
              className={`btn ${row.result === "NA" ? "na" : "btg"}`}
              disabled={locked}
              onClick={() => setResult("NA")}
            >
              N/A
            </button>
          )}
        </div>
      </td>
      <td>
        <input
          aria-label="Comment"
          value={row.note}
          disabled={locked}
          onChange={(event) => setRow({ ...row, note: event.target.value })}
          onBlur={(event) => saveText("note", event.target.value)}
        />
        <AttachmentStrip
          attachments={item.attachments}
          projectId={projectId}
          scope={item.kind}
          itemId={item.id}
          canDelete={canDelete}
          locked={locked}
        />
      </td>
      <td>
        {canDelete && !locked ? (
          <ActionButton
            action={deleteCheckItemAction}
            fields={{ projectId, itemId: item.id }}
            label="Del"
          />
        ) : null}
      </td>
    </tr>
  );
}
