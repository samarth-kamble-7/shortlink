import { Suspense } from "react";
import { getMyLinksAction } from "@/app/actions/link-actions";
import { getProfileAction } from "@/app/actions/auth-actions";
import { getAggregatedAnalyticsAction } from "@/app/actions/analytics-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Analytics & Telemetry — ShortLink",
  description: "Real-time click streams, time-series windows, GeoIP enrichment, and Kafka streaming aggregation.",
};

async function AnalyticsContent() {
  const [links, userProfile] = await Promise.all([
    getMyLinksAction(),
    getProfileAction(),
  ]);

  const initialData = await getAggregatedAnalyticsAction("24h", links);

  return (
    <DashboardShell links={links} userProfile={userProfile}>
      <AnalyticsView initialLinks={links} initialData={initialData} />
    </DashboardShell>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      <Skeleton className="h-14 w-full rounded-2xl" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      <Skeleton className="h-[360px] w-full rounded-2xl" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
