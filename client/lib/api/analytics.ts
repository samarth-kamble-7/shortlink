import { AnalyticsWindow, LinkAnalyticsData, TimeSeriesPoint } from "@/lib/analytics-schemas";
import { LinkItem } from "@/lib/link-schemas";

const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";

function createEmptyAnalytics(window: AnalyticsWindow, shortCode?: string, longUrl?: string): LinkAnalyticsData {
  return {
    shortCode,
    longUrl,
    window,
    totalClicks: 0,
    uniqueVisitors: 0,
    lastClickedAt: null,
    deviceBreakdown: {},
    browserBreakdown: {},
    topReferrers: {},
    countryBreakdown: {},
    cityBreakdown: {},
    timeSeries: [],
  };
}

/**
 * Fetches real-time analytics for a single short code from Spring Boot.
 */
export async function fetchLinkAnalyticsApi(
  shortCode: string,
  window: AnalyticsWindow = "all",
  token?: string
): Promise<LinkAnalyticsData> {
  if (!shortCode) {
    return createEmptyAnalytics(window);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(
      `${BACKEND_INTERNAL_URL}/api/v1/links/${shortCode}/analytics?window=${encodeURIComponent(window)}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return createEmptyAnalytics(window, shortCode);
    }

    const data = await res.json();

    const timeSeries: TimeSeriesPoint[] = Array.isArray(data.timeSeries)
      ? data.timeSeries.map((p: { timestamp: string; clicks: number }) => ({
          timestamp: p.timestamp,
          clicks: Number(p.clicks) || 0,
        }))
      : [];

    return {
      shortCode: data.shortCode || shortCode,
      longUrl: data.longUrl,
      window: (data.window as AnalyticsWindow) || window,
      totalClicks: Number(data.totalClicks) || 0,
      uniqueVisitors: Number(data.uniqueVisitors) || 0,
      lastClickedAt: data.lastClickedAt || null,
      deviceBreakdown: data.deviceBreakdown || {},
      browserBreakdown: data.browserBreakdown || {},
      topReferrers: data.topReferrers || {},
      countryBreakdown: data.countryBreakdown || {},
      cityBreakdown: data.cityBreakdown || {},
      timeSeries,
    };
  } catch (err) {
    console.warn(`Failed to fetch analytics for /${shortCode}:`, err);
    return createEmptyAnalytics(window, shortCode);
  }
}

/**
 * Aggregates analytics across all links belonging to the user for the global dashboard view.
 */
export async function fetchAggregatedAnalyticsApi(
  links: LinkItem[],
  window: AnalyticsWindow = "all",
  token?: string
): Promise<LinkAnalyticsData> {
  if (!links || links.length === 0) {
    return createEmptyAnalytics(window);
  }

  try {
    const results = await Promise.all(
      links.map((link) => fetchLinkAnalyticsApi(link.shortCode, window, token))
    );

    let totalClicks = 0;
    let uniqueVisitors = 0;
    let mostRecentClick: string | null = null;
    const deviceBreakdown: Record<string, number> = {};
    const browserBreakdown: Record<string, number> = {};
    const topReferrers: Record<string, number> = {};
    const countryBreakdown: Record<string, number> = {};
    const cityBreakdown: Record<string, number> = {};
    const timeSeriesMap = new Map<string, number>();

    for (const item of results) {
      totalClicks += item.totalClicks;
      uniqueVisitors += item.uniqueVisitors;

      if (item.lastClickedAt) {
        if (!mostRecentClick || new Date(item.lastClickedAt) > new Date(mostRecentClick)) {
          mostRecentClick = item.lastClickedAt;
        }
      }

      // Merge maps defensively
      const mergeMap = (source?: Record<string, number> | null, target?: Record<string, number>) => {
        if (!source || !target) return;
        for (const [key, count] of Object.entries(source)) {
          target[key] = (target[key] || 0) + Number(count);
        }
      };

      mergeMap(item.deviceBreakdown, deviceBreakdown);
      mergeMap(item.browserBreakdown, browserBreakdown);
      mergeMap(item.topReferrers, topReferrers);
      mergeMap(item.countryBreakdown, countryBreakdown);
      mergeMap(item.cityBreakdown, cityBreakdown);

      // Merge time series defensively
      if (Array.isArray(item.timeSeries)) {
        for (const pt of item.timeSeries) {
          if (!pt || !pt.timestamp) continue;
          const current = timeSeriesMap.get(pt.timestamp) || 0;
          timeSeriesMap.set(pt.timestamp, current + (Number(pt.clicks) || 0));
        }
      }
    }

    // Sort time series by timestamp
    const sortedTimeSeries: TimeSeriesPoint[] = Array.from(timeSeriesMap.entries())
      .map(([timestamp, clicks]) => ({ timestamp, clicks }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      window,
      totalClicks,
      uniqueVisitors,
      lastClickedAt: mostRecentClick,
      deviceBreakdown,
      browserBreakdown,
      topReferrers,
      countryBreakdown,
      cityBreakdown,
      timeSeries: sortedTimeSeries,
    };
  } catch (err) {
    console.warn("Failed to compute aggregated analytics:", err);
    return createEmptyAnalytics(window);
  }
}

