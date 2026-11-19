import type { ProjectView } from "./types";

export interface HandoverReadiness {
  ready: number;
  total: number;
  percent: number;
  missing: string[];
  satSigned: boolean;
  complete: boolean;
}

export function handoverReadiness(project: ProjectView): HandoverReadiness {
  const total = project.docs.length;
  const ready = project.docs.filter((doc) => doc.ready).length;
  const missing = project.docs.filter((doc) => !doc.ready).map((doc) => doc.slot);
  const satSigned = Boolean(project.signedBy);
  const percent = total ? Math.round((ready / total) * 100) : 0;

  return {
    ready,
    total,
    percent,
    missing,
    satSigned,
    complete: total > 0 && ready === total && satSigned,
  };
}
