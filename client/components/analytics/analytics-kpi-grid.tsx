"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MousePointerClick, Users, Globe, MapPin } from "lucide-react";

interface AnalyticsKpiGridProps {
  totalClicks?: number;
  uniqueVisitors?: number;
  topReferrer?: string;
  topCountry?: string;
}

function formatKpiReferrer(raw?: string): string {
  if (!raw || raw.toLowerCase() === "direct" || raw.toLowerCase() === "none") {
    return "Direct";
  }
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function formatKpiCountry(raw?: string): string {
  if (!raw || raw.toLowerCase() === "global") return "Global";
  if (raw.toLowerCase().includes("local")) return "Local Net";
  if (raw.length === 2) return raw.toUpperCase();
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function AnalyticsKpiGrid({
  totalClicks = 0,
  uniqueVisitors = 0,
  topReferrer = "Direct",
  topCountry = "Global",
}: AnalyticsKpiGridProps) {
  const kpis = [
    {
      title: "Total Clicks",
      value: (totalClicks || 0).toLocaleString(),
      subtitle: "Redirect events",
      icon: MousePointerClick,
    },
    {
      title: "Unique Visitors",
      value: (uniqueVisitors || 0).toLocaleString(),
      subtitle: "IP deduplicated",
      icon: Users,
    },
    {
      title: "Top Referrer",
      value: formatKpiReferrer(topReferrer),
      subtitle: "Primary acquisition",
      icon: Globe,
      truncate: true,
    },
    {
      title: "Top Country",
      value: formatKpiCountry(topCountry),
      subtitle: "Geographic leader",
      icon: MapPin,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.title}
            className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-xs backdrop-blur-xs transition-colors hover:border-border"
          >
            <CardContent className="p-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {kpi.title}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p
                  className={`font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums ${
                    kpi.truncate ? "truncate text-lg sm:text-2xl" : ""
                  }`}
                  title={kpi.truncate ? kpi.value : undefined}
                >
                  {kpi.value}
                </p>
                <p className="text-[11px] text-muted-foreground/75 pt-0.5">
                  {kpi.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
