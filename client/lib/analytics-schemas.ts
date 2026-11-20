export type AnalyticsWindow = "24h" | "7d" | "30d" | "all";

export interface TimeSeriesPoint {
  timestamp: string;
  clicks: number;
}

export interface LinkAnalyticsData {
  shortCode?: string;
  longUrl?: string;
  window: AnalyticsWindow;
  totalClicks: number;
  uniqueVisitors: number;
  lastClickedAt: string | null;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  topReferrers: Record<string, number>;
  countryBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
  timeSeries: TimeSeriesPoint[];
}

export interface AnalyticsScopeOption {
  value: string; // "all" | shortCode
  label: string;
  shortCode?: string;
  destinationUrl?: string;
  clickCount?: number;
}

