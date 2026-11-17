import { CalendarDays, ClipboardList, MapPin, MessageSquare, Plus } from "lucide-react";
import { Checklist } from "@/components/checklist";
import { ReviewForm, ReviewList } from "@/components/reviews";
import { PlanVisitForm, VisitRow } from "@/components/visit-row";
import type { ProjectView } from "@/lib/types";
import type { Role } from "@/lib/roles";

export function SurveyView({ project, role }: { project: ProjectView; role: Role }) {
  const reviews = project.stageReviews.filter((review) => review.key === "survey");
  const canDelete = role === "admin" || role === "superadmin";

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6 px-4 sm:px-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MapPin className="size-6 text-brand" />
          Survey & Site Visits
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Plan site visits, track findings, manage survey checklists, and review project status updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        
        {/* Left Column (Main Content) */}
        <div className="space-y-8">
          
          {/* Visits Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Previsits & Site Visits</h2>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date / Type / Who</th>
                      <th className="px-4 py-3 font-semibold">Purpose / Findings</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.visits.length ? (
                      project.visits.map((visit) => (
                        <VisitRow
                          key={visit.id}
                          projectId={project.id}
                          visit={visit}
                          canDelete={canDelete}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CalendarDays className="size-8 text-slate-300" />
                            <p>No site visits planned yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Plan Visit Form Wrapper */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
               <div className="flex items-center gap-2 mb-4">
                  <Plus className="size-4 text-brand" />
                  <h3 className="text-sm font-semibold text-slate-800">Plan a new visit</h3>
               </div>
               <PlanVisitForm projectId={project.id} />
            </div>
          </section>

          {/* Checklist Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Survey Checklist</h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
               <Checklist project={project} kind="survey" role={role} />
            </div>
          </section>

        </div>

        {/* Right Column (Sidebar: Reviews) */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 flex items-center gap-2">
              <MessageSquare className="size-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Survey Reviews & Updates</h2>
            </div>
            
            <div className="p-5 flex-1 bg-white">
              {/* Reviews List */}
              <div className="mb-6">
                 <ReviewList reviews={reviews} />
              </div>
              
              {/* Review Form */}
              <div className="border-t border-slate-100 pt-5">
                 <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                   Add a review
                 </h3>
                 <ReviewForm projectId={project.id} keyName="survey" />
              </div>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}