import { Suspense } from "react";
import { UsersView } from "@/components/views/users-view";
import { requireUser } from "@/lib/auth";
import { getUsers } from "@/lib/data";

async function UsersContent() {
  await requireUser("superadmin");
  const users = await getUsers();
  return <UsersView users={users} />;
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="empty">Loading…</div>}>
      <UsersContent />
    </Suspense>
  );
}
