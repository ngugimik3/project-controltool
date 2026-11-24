import { addParamAction, addProjectTypeAction, createProjectAction, saveProjectSpecAction, updateProjectAction } from "@/lib/actions/project";
import { PARAM_GROUPS, PARAM_SUGGESTIONS } from "@/lib/defaults";
import { can, type Role } from "@/lib/roles";
import type { ProjectView, SettingsView } from "@/lib/types";
import { AutoForm, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { ParamRow } from "@/components/param-row";
import { ProjectTable } from "@/components/project-table";

function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="card collapsible" open={defaultOpen}>
      <summary className="ct">{title}</summary>
      <div className="collapsible-body">{children}</div>
    </details>
  );
}

export function ProjectsView({
  project,
  projects,
  settings,
  role,
}: {
  project: ProjectView | null;
  projects: ProjectView[];
  settings: SettingsView;
  role: Role;
}) {
  const isAdmin = can(role, "admin", "superadmin");

  return (
    <div className="view-stack">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} in the portfolio · create, specify, and manage delivery`}
      />

      {/* 1. Primary content first */}
      <div className="card">
        <div className="ct">All projects</div>
        <ProjectTable projects={projects} role={role} />
      </div>

      {/* 2. Selected project: spec, parameters, add-parameter in one card */}
      {project ? (
        <div className="card">
          <div className="ct">Technical spec: {project.name}</div>
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
                        canDelete={isAdmin}
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

          <div className="ct" style={{ marginTop: "1rem" }}>
            Add parameter
          </div>
          <SubmitForm action={addParamAction} submitLabel="Add parameter" resetOnSuccess>
            <input type="hidden" name="projectId" value={project.id} />
            <div className="f">
              <select name="groupName" aria-label="Parameter group">
                {PARAM_GROUPS.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              <input name="name" list="param-suggestions" placeholder="Parameter or feature" />
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
      ) : null}

      {/* 3. Secondary actions, collapsed by default */}
      {project && isAdmin ? (
        <Collapsible title="Edit project details">
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
        </Collapsible>
      ) : null}

      <Collapsible title="New project" defaultOpen={projects.length === 0}>
        <SubmitForm action={createProjectAction} submitLabel="Create project" resetOnSuccess>
          <div className="f">
            <input name="name" placeholder="Project name" required />
            <input name="client" placeholder="Client" required />
            <select name="type" aria-label="Category" defaultValue={settings.projectTypes[0]}>
              {settings.projectTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <input
              name="contract"
              type="number"
              min="0"
              step="any"
              placeholder="Project value"
              required
            />
          </div>
        </SubmitForm>
      </Collapsible>

      <Collapsible title={`Project categories (${settings.projectTypes.length})`}>
        <div className="grow">
          {settings.projectTypes.map((type) => (
            <span key={type} className="badge bn">
              {type}
            </span>
          ))}
        </div>
        <SubmitForm action={addProjectTypeAction} submitLabel="Add category" resetOnSuccess>
          <div className="grow" style={{ marginBottom: 0 }}>
            <input
              name="name"
              placeholder="New category, e.g. Solar PV system"
              style={{ maxWidth: 320 }}
            />
          </div>
        </SubmitForm>
      </Collapsible>
    </div>
  );
}