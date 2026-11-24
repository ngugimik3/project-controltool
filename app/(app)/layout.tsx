import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

async function Guard({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}
