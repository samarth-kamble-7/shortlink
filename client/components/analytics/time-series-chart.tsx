"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeSeriesPoint, AnalyticsWindow } from "@/lib/analytics-schemas";
import { TrendingUp, Activity } from "lucide-react";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  window: AnalyticsWindow;
  totalClicks: number;
  isLoading?: boolean;
}

const emptySubscribe = () => () => {};

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatTimestamp(isoString: string, window: AnalyticsWindow): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    if (window === "24h") {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return isoString;
  }
}

export function TimeSeriesChart({
  data,
  window,
  totalClicks,
  isLoading = false,
}: TimeSeriesChartProps) {
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.map((pt) => ({
      ...pt,
      formattedTime: formatTimestamp(pt.timestamp, window),
    }));
  }, [data, window]);

  const windowLabelMap: Record<AnalyticsWindow, string> = {
    "24h": "Last 24 Hours",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    all: "All Time",
  };

  return (
    <Card className="rounded-2xl border-border/80 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Click Volume Over Time
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Sampled by {window === "24h" ? "hour" : "day"} · {windowLabelMap[window]}
          </CardDescription>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {totalClicks.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span>Recorded traffic</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!mounted || isLoading ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-xl bg-muted/10 animate-pulse border border-border/40">
            <span className="text-xs font-mono text-muted-foreground/60">Loading telemetry visualization...</span>
          </div>
        ) : chartData.length === 0 || totalClicks === 0 ? (
          <div className="flex h-[280px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">
              No click events recorded in this time window
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-xs">
              Direct traffic through your short URLs to see real-time streaming charts populate.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full aspect-auto">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border/40"
              />
              <XAxis
                dataKey="formattedTime"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                className="text-[11px] font-mono fill-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                className="text-[11px] font-mono fill-muted-foreground"
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#clicksGradient)"
                activeDot={{ r: 5, className: "fill-primary stroke-background stroke-2" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
