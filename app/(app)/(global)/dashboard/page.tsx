import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardSection } from "@/components/views/dashboard-view";
import { requireUser } from "@/lib/auth";
import { parseRange } from "@/lib/dashboard";

async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  return <DashboardSection range={parseRange(query.range)} role={user.role} />;
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
