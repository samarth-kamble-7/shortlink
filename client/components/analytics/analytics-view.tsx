"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { LinkItem } from "@/lib/link-schemas";
import { AnalyticsWindow, LinkAnalyticsData } from "@/lib/analytics-schemas";
import { getLinkAnalyticsAction, getAggregatedAnalyticsAction } from "@/app/actions/analytics-actions";
import { AnalyticsToolbar } from "@/components/analytics/analytics-toolbar";
import { AnalyticsKpiGrid } from "@/components/analytics/analytics-kpi-grid";
import { TimeSeriesChart } from "@/components/analytics/time-series-chart";
import { DeviceBreakdownCard } from "@/components/analytics/device-breakdown-card";
import { BrowserBreakdownCard } from "@/components/analytics/browser-breakdown-card";
import { ReferrersCard } from "@/components/analytics/referrers-card";
import { GeoBreakdownCard } from "@/components/analytics/geo-breakdown-card";
import { toast } from "sonner";

interface AnalyticsViewProps {
  initialLinks: LinkItem[];
  initialData: LinkAnalyticsData;
}

export function AnalyticsView({
  initialLinks,
  initialData,
}: AnalyticsViewProps) {
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [selectedWindow, setSelectedWindow] = useState<AnalyticsWindow>("24h");
  const [analyticsData, setAnalyticsData] = useState<LinkAnalyticsData>(initialData);
  const [isPending, startTransition] = useTransition();

  const prevClicksRef = useRef<number>(initialData?.totalClicks ?? 0);
  const isInitialMount = useRef(true);

  // Manual or toolbar driven scope/window change
  const handleScopeOrWindowChange = (newScope: string, newWindow: AnalyticsWindow) => {
    setSelectedScope(newScope);
    setSelectedWindow(newWindow);

    startTransition(async () => {
      try {
        let result: LinkAnalyticsData;
        if (newScope === "all") {
          result = await getAggregatedAnalyticsAction(newWindow, initialLinks);
        } else {
          result = await getLinkAnalyticsAction(newScope, newWindow);
        }
        prevClicksRef.current = result.totalClicks;
        setAnalyticsData(result);
      } catch {
        toast.error("Failed to load telemetry data");
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        let result: LinkAnalyticsData;
        if (selectedScope === "all") {
          result = await getAggregatedAnalyticsAction(selectedWindow, initialLinks);
        } else {
          result = await getLinkAnalyticsAction(selectedScope, selectedWindow);
        }
        prevClicksRef.current = result.totalClicks;
        setAnalyticsData(result);
        toast.success("Telemetry refreshed");
      } catch {
        toast.error("Failed to refresh telemetry");
      }
    });
  };

  // Real-Time Background Synchronization Engine (polling every 3s + window focus sync)
  useEffect(() => {
    let isSubscribed = true;

    const syncTelemetry = async () => {
      // Pause if browser tab is hidden to save network/CPU
      if (document.visibilityState === "hidden") return;

      try {
        let result: LinkAnalyticsData;
        if (selectedScope === "all") {
          result = await getAggregatedAnalyticsAction(selectedWindow, initialLinks);
        } else {
          result = await getLinkAnalyticsAction(selectedScope, selectedWindow);
        }

        if (!isSubscribed) return;

        // Detect new incoming clicks
        if (!isInitialMount.current && result.totalClicks > prevClicksRef.current) {
          const delta = result.totalClicks - prevClicksRef.current;
          toast.success(`⚡ ${delta} new click${delta > 1 ? "s" : ""} recorded!`, {
            description: "Real-time Kafka streaming aggregation updated.",
          });
        }

        prevClicksRef.current = result.totalClicks;
        setAnalyticsData(result);
      } catch {
        // Silent failure during background polling
      }
    };

    isInitialMount.current = false;

    // Window focus sync: whenever the user clicks a short link in another tab and returns
    const handleFocus = () => {
      syncTelemetry();
    };

    window.addEventListener("focus", handleFocus);

    // Periodic 3-second background polling
    const intervalId = setInterval(() => {
      syncTelemetry();
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [selectedScope, selectedWindow, initialLinks]);

  // Determine top values for KPIs safely
  const topReferrer = React.useMemo(() => {
    const entries = Object.entries(analyticsData?.topReferrers || {}).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : "Direct";
  }, [analyticsData?.topReferrers]);

  const topCountry = React.useMemo(() => {
    const entries = Object.entries(analyticsData?.countryBreakdown || {}).sort((a, b) => b[1] - a[1]);
    return entries.length > 0 ? entries[0][0] : "Global";
  }, [analyticsData?.countryBreakdown]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Analytics & Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Sub-millisecond redirect metrics, sliding time-series windows, GeoIP enrichment, and Kafka streaming aggregation.
        </p>
      </div>

      {/* Control Toolbar */}
      <AnalyticsToolbar
        links={initialLinks}
        selectedScope={selectedScope}
        onScopeChange={(scope) => handleScopeOrWindowChange(scope, selectedWindow)}
        selectedWindow={selectedWindow}
        onWindowChange={(window) => handleScopeOrWindowChange(selectedScope, window)}
        onRefresh={handleRefresh}
        isRefreshing={isPending}
      />

      {/* Hero KPIs */}
      <AnalyticsKpiGrid
        totalClicks={analyticsData?.totalClicks || 0}
        uniqueVisitors={analyticsData?.uniqueVisitors || 0}
        topReferrer={topReferrer}
        topCountry={topCountry}
      />

      {/* Main Time-Series Trend */}
      <TimeSeriesChart
        data={analyticsData?.timeSeries || []}
        window={selectedWindow}
        totalClicks={analyticsData?.totalClicks || 0}
        isLoading={isPending}
      />

      {/* Categorical Breakdown Grid (2x2) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DeviceBreakdownCard
          data={analyticsData?.deviceBreakdown}
          totalClicks={analyticsData?.totalClicks}
        />
        <BrowserBreakdownCard
          data={analyticsData?.browserBreakdown}
          totalClicks={analyticsData?.totalClicks}
        />
        <ReferrersCard
          data={analyticsData?.topReferrers}
          totalClicks={analyticsData?.totalClicks}
        />
        <GeoBreakdownCard
          countryData={analyticsData?.countryBreakdown}
          cityData={analyticsData?.cityBreakdown}
          totalClicks={analyticsData?.totalClicks}
        />
      </div>
    </div>
  );
}
