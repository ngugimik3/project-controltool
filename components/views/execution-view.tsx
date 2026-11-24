import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { CHECK_LABELS } from "@/lib/defaults";
import type { ProjectView } from "@/lib/types";

const MODULES = [
  { segment: "fat", kind: "fat", copy: "Factory acceptance checklist and rework tasks." },
  { segment: "install", kind: "install", copy: "Site installation steps and status reviews." },
  { segment: "commis", kind: "commis", copy: "Bring-up, checks and verification steps." },
  { segment: "sat", kind: "sat", copy: "Site acceptance results and client sign-off." },
  { segment: "training", kind: "training", copy: "Operator and maintainer training checklist." },
  { segment: "support", kind: "support", copy: "Tools, service parts and warranty closeout." },
];

export function ExecutionView({ project }: { project: ProjectView }) {
  return (
    <div className="view-stack">
      <PageHeader
        title="Execution"
        subtitle={`${project.name} · delivery and acceptance modules`}
      />

      <div className="card">
        <div className="ct">Execution modules</div>
        <div className="sc">
          <table className="tbl">
            <thead>
              <tr>
                <th>Module</th>
                <th>Progress</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((module) => {
                const items = project.checkItems.filter((item) =>
                  module.kind === "support"
                    ? ["tools", "parts", "warranty"].includes(item.kind)
                    : item.kind === module.kind,
                );
                const done = items.filter((item) => item.status === 3 || item.result === "Pass").length;
                const open = items.length - done;
                return (
                  <tr key={module.segment}>
                    <td>
                      <div className="b">{CHECK_LABELS[module.kind] ?? module.kind}</div>
                      <div className="sub">{module.copy}</div>
                    </td>
                    <td>
                      {done}/{items.length}
                    </td>
                    <td>
                      <Link
                        className="btn btg"
                        href={`/projects/${project.id}/${module.segment}`}
                      >
                        {open ? "Open" : "Review"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
