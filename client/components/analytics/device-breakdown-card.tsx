"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Smartphone, Tablet, Monitor } from "lucide-react";

interface DeviceBreakdownCardProps {
  data?: Record<string, number> | null;
  totalClicks?: number;
}

function formatDeviceName(device: string): string {
  const d = (device || "").toLowerCase();
  if (d.includes("desktop") || d.includes("mac") || d.includes("windows") || d.includes("pc")) {
    return "Desktop";
  }
  if (d.includes("mobile") || d.includes("phone") || d.includes("android") || d.includes("ios")) {
    return "Mobile";
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return "Tablet";
  }
  return device ? device.charAt(0).toUpperCase() + device.slice(1).toLowerCase() : "Unknown";
}

function getDeviceIcon(device: string) {
  const d = (device || "").toLowerCase();
  if (d.includes("desktop") || d.includes("mac") || d.includes("windows") || d.includes("pc")) {
    return <Laptop className="h-4 w-4 text-muted-foreground" />;
  }
  if (d.includes("mobile") || d.includes("phone") || d.includes("android") || d.includes("ios")) {
    return <Smartphone className="h-4 w-4 text-muted-foreground" />;
  }
  if (d.includes("tablet") || d.includes("ipad")) {
    return <Tablet className="h-4 w-4 text-muted-foreground" />;
  }
  return <Monitor className="h-4 w-4 text-muted-foreground" />;
}

export function DeviceBreakdownCard({
  data,
  totalClicks = 0,
}: DeviceBreakdownCardProps) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <CardHeader className="p-0 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-sm font-semibold text-foreground">
            Devices
          </CardTitle>
          <span className="text-[11px] font-mono text-muted-foreground">
            {entries.length} {entries.length === 1 ? "type" : "types"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-1 divide-y divide-border/30">
        {entries.length === 0 || totalClicks === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No device telemetry recorded yet
          </div>
        ) : (
          entries.map(([device, count]) => {
            const percentage = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
            return (
              <div
                key={device}
                className="flex items-center justify-between py-2.5 text-xs transition-colors hover:bg-muted/15 px-1"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getDeviceIcon(device)}
                  <span className="font-medium text-foreground truncate">
                    {formatDeviceName(device)}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono shrink-0">
                  <span className="text-muted-foreground text-[11px] tabular-nums">
                    {count.toLocaleString()}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums text-xs min-w-[36px] text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
