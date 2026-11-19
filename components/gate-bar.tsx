"use client";

import { useState } from "react";
import Link from "next/link";
import { STAGE_TAB, STAGES } from "@/lib/constants";
import { can, type Role } from "@/lib/roles";
import type { ProjectView } from "@/lib/types";
import { GateButton } from "./gate-button";

export function GateBar({ project, role }: { project: ProjectView | null; role: Role }) {
  const [expanded, setExpanded] = useState(false);
  if (!project) return null;

  const current = project.stage;
  const prev = current > 0 ? current - 1 : null;
  const next = current < STAGES.length - 1 ? current + 1 : null;
  const canAdvance = current < STAGES.length - 1 && can(role, "admin", "superadmin");

  const chip = (index: number, kind: "done" | "cur" | "muted") => {
    const label = STAGES[index];
    const tab = STAGE_TAB[label];
    const className = `gate-chip ${kind}`;
    if (tab && kind !== "cur") {
      return (
        <Link key={label} href={`/${tab}`} className={className}>
          {label}
        </Link>
      );
    }
    return (
      <span key={label} className={className}>
        {label}
      </span>
    );
  };

  return (
    <div className="gate" id="gate">
      <div className="gate-head">
        <div>
          <div className="gate-title">Pipeline stage</div>
          <div className="gate-current">{STAGES[current]}</div>
        </div>
        <div className="gate-compact">
          {prev !== null ? chip(prev, "done") : null}
          {chip(current, "cur")}
          {next !== null ? chip(next, "muted") : null}
          <button
            type="button"
            className="gate-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Hide stages" : "All stages"}
          </button>
          {canAdvance ? (
            <GateButton projectId={project.id} nextStage={STAGES[current + 1]} />
          ) : null}
        </div>
      </div>
      <div className="gate-expand" hidden={!expanded}>
        <div className="rail">
          {STAGES.map((stage, index) => {
            const tab = STAGE_TAB[stage];
            const className =
              index === current ? "cur" : index < current ? "done" : "";
            if (tab && index !== current) {
              return (
                <Link key={stage} href={`/${tab}`} className={className}>
                  {stage}
                </Link>
              );
            }
            return (
              <span key={stage} className={className}>
                {stage}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
