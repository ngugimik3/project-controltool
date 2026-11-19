import { AutoForm, ConfirmButton, SubmitForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import {
  addPurchaseOrderAction,
  deletePurchaseOrderAction,
  savePurchaseOrderAction,
} from "@/lib/actions/purchase-order";
import { PO_STATUS } from "@/lib/constants";
import { fmt, isPoSlipping } from "@/lib/planner";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function ProcurementView({ project, role }: { project: ProjectView; role: Role }) {
  const canDelete = role === "admin" || role === "superadmin";
  const slipping = project.purchaseOrders.filter(isPoSlipping).length;

  return (
    <div className="view-stack">
      <PageHeader
        title="Procurement"
        subtitle={`${project.name} · ${project.purchaseOrders.length} PO${project.purchaseOrders.length === 1 ? "" : "s"}${slipping ? ` · ${slipping} slipping` : ""}`}
      />

      <div className="card">
        <div className="ct">New purchase order</div>
        <SubmitForm
          action={addPurchaseOrderAction}
          submitLabel="Add purchase order"
          resetOnSuccess
          className="f"
          buttonClassName="btn btp"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <input name="item" placeholder="Component" required />
          <input name="supplier" placeholder="Supplier" required />
          <label>
            <span className="kl">Need by</span>
            <input type="date" name="needBy" required />
          </label>
          <label>
            <span className="kl">Promised</span>
            <input type="date" name="promisedBy" required />
          </label>
          <label>
            <span className="kl">Cost</span>
            <input type="number" name="cost" min="0" step="0.01" placeholder="Cost" required />
          </label>
        </SubmitForm>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="sc">
        <table className="tbl" style={{ border: 0, borderRadius: 0 }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Supplier</th>
              <th>Need by</th>
              <th>Promised</th>
              <th>Waybill / ETA</th>
              <th className="n">Cost</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {project.purchaseOrders.length ? (
              project.purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td>
                    {po.item}
                    {isPoSlipping(po) ? (
                      <span className="badge ba" style={{ marginLeft: 6 }}>
                        Slip
                      </span>
                    ) : null}
                  </td>
                  <td>{po.supplier}</td>
                  <td>{po.needBy}</td>
                  <td className={isPoSlipping(po) ? "warn" : undefined}>{po.promisedBy}</td>
                  <td>
                    <AutoForm action={savePurchaseOrderAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="poId" value={po.id} />
                      <input type="hidden" name="status" value={po.status} />
                      <input
                        aria-label="Waybill"
                        name="waybill"
                        defaultValue={po.waybill}
                        placeholder="Waybill / ETA"
                      />
                    </AutoForm>
                  </td>
                  <td className="n">{fmt(po.cost)}</td>
                  <td>
                    <AutoForm action={savePurchaseOrderAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="poId" value={po.id} />
                      <input type="hidden" name="waybill" value={po.waybill} />
                      <select aria-label="Status" name="status" defaultValue={po.status}>
                        {PO_STATUS.map((status, index) => (
                          <option key={status} value={index}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </AutoForm>
                  </td>
                  <td>
                    {canDelete ? (
                      <ConfirmButton
                        action={deletePurchaseOrderAction}
                        fields={{ projectId: project.id, poId: po.id }}
                        label="Del"
                        confirm="Delete this purchase order?"
                      />
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="empty">
                  No purchase orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
