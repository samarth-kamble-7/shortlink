"use server";

import { cookies } from "next/headers";
import { AnalyticsWindow, LinkAnalyticsData } from "@/lib/analytics-schemas";
import { fetchLinkAnalyticsApi, fetchAggregatedAnalyticsApi } from "@/lib/api/analytics";
import { getLinksApi } from "@/lib/api/links";

import { LinkItem } from "@/lib/link-schemas";

const ACCESS_COOKIE = "shortlink_access_token";

export async function getLinkAnalyticsAction(
  shortCode: string,
  window: AnalyticsWindow = "24h"
): Promise<LinkAnalyticsData> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  return await fetchLinkAnalyticsApi(shortCode, window, token);
}

export async function getAggregatedAnalyticsAction(
  window: AnalyticsWindow = "24h",
  links?: LinkItem[]
): Promise<LinkAnalyticsData> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  const targetLinks = links ?? (await getLinksApi(token));
  return await fetchAggregatedAnalyticsApi(targetLinks, window, token);
}

