"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Globe } from "lucide-react";

interface BrowserBreakdownCardProps {
  data?: Record<string, number> | null;
  totalClicks?: number;
}

export function BrowserBreakdownCard({
  data,
  totalClicks = 0,
}: BrowserBreakdownCardProps) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <CardHeader className="p-0 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-sm font-semibold text-foreground">
            Browsers
          </CardTitle>
          <span className="text-[11px] font-mono text-muted-foreground">
            {entries.length} detected
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-1 divide-y divide-border/30">
        {entries.length === 0 || totalClicks === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No browser telemetry recorded yet
          </div>
        ) : (
          entries.map(([browser, count]) => {
            const percentage = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
            return (
              <div
                key={browser}
                className="flex items-center justify-between py-2.5 text-xs transition-colors hover:bg-muted/15 px-1"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {browser.toLowerCase().includes("safari") ? (
                    <Compass className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-medium text-foreground truncate">
                    {browser || "Other"}
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
