import Link from "next/link";
import { AutoForm, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { ParamRow } from "@/components/param-row";
import {
  addParamAction,
  saveProjectSpecAction,
  updateProjectAction,
} from "@/lib/actions/project";
import { STAGES } from "@/lib/constants";
import { PARAM_GROUPS, PARAM_SUGGESTIONS } from "@/lib/defaults";
import { handoverReadiness } from "@/lib/handover";
import { finance, fmt, progress } from "@/lib/planner";
import { can, type Role } from "@/lib/roles";
import type { ProjectView, SettingsView } from "@/lib/types";

const MODULES = [
  { label: "Survey", segment: "survey" },
  { label: "Schedule", segment: "schedule" },
  { label: "Procurement", segment: "procurement" },
  { label: "Notes", segment: "notes" },
  { label: "Execution", segment: "execution" },
  { label: "Handover", segment: "handover" },
  { label: "Documents", segment: "documents" },
  { label: "Costing", segment: "costing" },
];

export function ProjectOverviewView({
  project,
  settings,
  role,
}: {
  project: ProjectView;
  settings: SettingsView;
  role: Role;
}) {
  const pct = progress(project);
  const money = finance(project);
  const readiness = handoverReadiness(project);

  return (
    <div className="view-stack">
      <PageHeader
        title={project.name}
        subtitle={`${project.client} · ${project.type} · ${STAGES[project.stage] ?? STAGES[0]}`}
      />

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kl">Progress</div>
          <div className="kv">{pct}%</div>
        </div>
        <div className="kpi">
          <div className="kl">Project value</div>
          <div className="kv">{fmt(project.contract)}</div>
        </div>
        <div className="kpi">
          <div className="kl">Forecast</div>
          <div className="kv">{fmt(money.forecast)}</div>
        </div>
        <div className="kpi">
          <div className="kl">Handover</div>
          <div className="kv">{readiness.percent}%</div>
        </div>
      </div>

      <div className="card">
        <div className="ct">Project modules</div>
        <div className="grow">
          {MODULES.map((module) => (
            <Link
              key={module.segment}
              className="btn btg"
              href={`/projects/${project.id}/${module.segment}`}
            >
              {module.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="ct">Technical spec</div>
        <p className="sub">
          Dimensions, voltage and power are required to pass the Inception gate.
        </p>
        <AutoForm action={saveProjectSpecAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <div className="f">
            <div>
              <label className="fl">Structural dimensions</label>
              <input name="dim" defaultValue={project.specDim} />
            </div>
            <div>
              <label className="fl">Voltage and phase</label>
              <input name="volt" defaultValue={project.specVolt} />
            </div>
            <div>
              <label className="fl">Power (kW)</label>
              <input name="kw" defaultValue={project.specKw} />
            </div>
            <div>
              <label className="fl">Standards required</label>
              <input name="std" defaultValue={project.specStd} />
            </div>
          </div>
          <div className="ct" style={{ marginTop: ".8rem" }}>
            Additional parameters and features
          </div>
          <div className="sc">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {project.params.length ? (
                  project.params.map((param) => (
                    <ParamRow
                      key={param.id}
                      projectId={project.id}
                      param={param}
                      canDelete={can(role, "admin", "superadmin")}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      No additional parameters yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <label className="fl">Notes</label>
          <textarea name="notes" defaultValue={project.specNotes} />
        </AutoForm>

        <div style={{ marginTop: 12 }}>
          <SubmitForm action={addParamAction} submitLabel="Add parameter" resetOnSuccess>
            <input type="hidden" name="projectId" value={project.id} />
            <div className="f">
              <select name="groupName" aria-label="Parameter group">
                {PARAM_GROUPS.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              <input
                name="name"
                list="param-suggestions"
                placeholder="Parameter or feature"
              />
              <input name="value" placeholder="Value" />
              <input name="unit" placeholder="Unit" />
            </div>
            <datalist id="param-suggestions">
              {PARAM_SUGGESTIONS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </SubmitForm>
        </div>
      </div>

      {can(role, "admin", "superadmin") ? (
        <div className="card">
          <div className="ct">Edit project details</div>
          <SubmitForm action={updateProjectAction} submitLabel="Save changes">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="f">
              <input name="name" defaultValue={project.name} placeholder="Project name" />
              <input name="client" defaultValue={project.client} placeholder="Client" />
              <select name="type" defaultValue={project.type} aria-label="Category">
                {Array.from(new Set([...settings.projectTypes, project.type])).map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <input
                name="contract"
                type="number"
                min="0"
                step="any"
                defaultValue={project.contract}
                placeholder="Project value"
              />
            </div>
          </SubmitForm>
        </div>
      ) : null}
    </div>
  );
}
