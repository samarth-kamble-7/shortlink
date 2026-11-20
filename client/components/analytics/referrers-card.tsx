"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ArrowUpRight } from "lucide-react";

interface ReferrersCardProps {
  data?: Record<string, number> | null;
  totalClicks?: number;
}

function formatReferrer(raw: string): { label: string; isDirect: boolean } {
  if (!raw || raw.toLowerCase() === "direct" || raw.toLowerCase() === "none") {
    return { label: "Direct / None", isDirect: true };
  }
  const clean = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return { label: clean || raw, isDirect: false };
}

export function ReferrersCard({
  data,
  totalClicks = 0,
}: ReferrersCardProps) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <CardHeader className="p-0 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-sm font-semibold text-foreground">
            Top Referrers
          </CardTitle>
          <span className="text-[11px] font-mono text-muted-foreground">
            {entries.length} {entries.length === 1 ? "source" : "sources"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-1 divide-y divide-border/30">
        {entries.length === 0 || totalClicks === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No referrer telemetry recorded yet
          </div>
        ) : (
          entries.map(([referrer, count]) => {
            const percentage = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
            const { label, isDirect } = formatReferrer(referrer);
            return (
              <div
                key={referrer}
                className="flex items-center justify-between py-2.5 text-xs transition-colors hover:bg-muted/15 px-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate" title={referrer}>
                    {label}
                  </span>
                  {!isDirect && (
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
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
