import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}

export default function GlobalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
