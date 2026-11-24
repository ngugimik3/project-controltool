import { Suspense } from "react";
import { SettingsView } from "@/components/views/settings-view";
import { requireUser } from "@/lib/auth";
import { getActivity, getSettings } from "@/lib/data";

async function SettingsContent() {
  const user = await requireUser("admin", "superadmin");
  const [settings, activity] = await Promise.all([getSettings(), getActivity()]);
  return <SettingsView role={user.role} settings={settings} activity={activity} />;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <SettingsContent />
    </Suspense>
  );
}
