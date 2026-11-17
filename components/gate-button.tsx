"use client";

import { useState, useTransition } from "react";
import { passGateAction } from "@/lib/actions/project";
import { toast } from "./toast";

export function GateButton({ projectId, nextStage }: { projectId: string; nextStage: string }) {
  const [pending, startTransition] = useTransition();
  const [blockers, setBlockers] = useState<string[]>([]);

  function onClick() {
    const formData = new FormData();
    formData.set("projectId", projectId);
    startTransition(async () => {
      const result = await passGateAction(formData);
      if (result.blockers?.length) {
        setBlockers(result.blockers);
        return;
      }
      if (result.error) {
        toast(result.error);
        return;
      }
      setBlockers([]);
      if (result.message) toast(result.message);
    });
  }

  return (
    <>
      <div className="grow">
        <button type="button" className="btn btp a" onClick={onClick} disabled={pending}>
          {pending ? "Checking…" : `Pass gate and move to ${nextStage}`}
        </button>
      </div>
      {blockers.length ? (
        <ul className="err">
          {blockers.map((blocker) => (
            <li key={blocker}>{blocker}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
