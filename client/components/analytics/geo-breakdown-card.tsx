"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

interface GeoBreakdownCardProps {
  countryData?: Record<string, number> | null;
  cityData?: Record<string, number> | null;
  totalClicks?: number;
}

function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length !== 2) return "🌐";
  try {
    const codePoints = isoCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

function formatCountryName(country: string): string {
  if (!country) return "Unknown";
  const c = country.trim().toLowerCase();
  if (c === "local network" || c === "local") {
    return "Local Network";
  }
  if (country.length === 2) {
    return country.toUpperCase();
  }
  return country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
}

export function GeoBreakdownCard({
  countryData,
  cityData,
  totalClicks = 0,
}: GeoBreakdownCardProps) {
  const countryEntries = Object.entries(countryData || {}).sort((a, b) => b[1] - a[1]);
  const cityEntries = cityData ? Object.entries(cityData || {}).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];

  return (
    <Card className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs backdrop-blur-xs">
      <CardHeader className="p-0 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-sm font-semibold text-foreground">
            Geolocation (GeoIP)
          </CardTitle>
          <span className="text-[11px] font-mono text-muted-foreground">
            {countryEntries.length} {countryEntries.length === 1 ? "country" : "countries"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-1 divide-y divide-border/30">
        {countryEntries.length === 0 || totalClicks === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No geographic telemetry recorded yet
          </div>
        ) : (
          <>
            {countryEntries.slice(0, 5).map(([country, count]) => {
              const percentage = totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0;
              const flag = getCountryFlag(country);
              const isLocal = country.toLowerCase().includes("local");

              return (
                <div
                  key={country}
                  className="flex items-center justify-between py-2.5 text-xs transition-colors hover:bg-muted/15 px-1"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isLocal ? (
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <span className="text-sm leading-none shrink-0">{flag}</span>
                    )}
                    <span className="font-medium text-foreground truncate">
                      {formatCountryName(country)}
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
            })}

            {cityEntries.length > 0 && (
              <div className="pt-3 pb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-[11px] font-medium text-muted-foreground">Top Cities:</span>
                <div className="flex items-center gap-2 text-[11px]">
                  {cityEntries.map(([city, count], idx) => (
                    <span key={city} className="flex items-center gap-1">
                      <span className="font-medium text-foreground">{city}</span>
                      <span className="font-mono text-muted-foreground">({count})</span>
                      {idx < cityEntries.length - 1 && <span className="text-border">·</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
