"use client";

import React from "react";
import { AnalyticsWindow } from "@/lib/analytics-schemas";
import { LinkItem } from "@/lib/link-schemas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Link2, Layers, ChevronDown, Check } from "lucide-react";

interface AnalyticsToolbarProps {
  links: LinkItem[];
  selectedScope: string; // "all" | shortCode
  onScopeChange: (scope: string) => void;
  selectedWindow: AnalyticsWindow;
  onWindowChange: (window: AnalyticsWindow) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const windowOptions: Array<{ id: AnalyticsWindow; label: string }> = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All time" },
];

export function AnalyticsToolbar({
  links,
  selectedScope,
  onScopeChange,
  selectedWindow,
  onWindowChange,
  onRefresh,
  isRefreshing = false,
}: AnalyticsToolbarProps) {
  const activeLink = links.find((l) => l.shortCode === selectedScope);
  const activeLabel =
    selectedScope === "all"
      ? `All Links Overview (${links.length})`
      : activeLink
      ? `/${activeLink.shortCode} — ${activeLink.longUrl.replace(/^https?:\/\//, "")}`
      : `/${selectedScope}`;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs backdrop-blur-xs sm:flex-row sm:items-center sm:justify-between">
      {/* Scope Switcher: Custom styled Dropdown Menu */}
      <div className="flex items-center gap-2 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-8 w-full sm:w-72 items-center justify-between rounded-lg border border-border/80 bg-background/80 px-2.5 text-xs font-medium text-foreground hover:border-border transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-primary">
            <div className="flex items-center gap-2 truncate">
              {selectedScope === "all" ? (
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
              <span className="truncate">{activeLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="!w-72 w-72 min-w-72 max-h-64 overflow-y-auto p-1 shadow-md border-border/80 bg-popover rounded-xl text-xs"
          >
            <DropdownMenuItem
              onClick={() => onScopeChange("all")}
              className="flex items-center justify-between py-1.5 px-2 font-medium cursor-pointer rounded-lg hover:bg-muted/70"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">All Links Overview ({links.length})</span>
              </div>
              {selectedScope === "all" && (
                <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
              )}
            </DropdownMenuItem>

            {links.length > 0 && <DropdownMenuSeparator className="my-1" />}

            {links.map((link) => {
              const isSelected = selectedScope === link.shortCode;
              const cleanUrl = link.longUrl.replace(/^https?:\/\//, "");
              return (
                <DropdownMenuItem
                  key={link.shortCode}
                  onClick={() => onScopeChange(link.shortCode)}
                  className="flex items-center justify-between py-1.5 px-2 font-medium cursor-pointer rounded-lg hover:bg-muted/70"
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-primary font-semibold shrink-0">
                      /{link.shortCode}
                    </span>
                    <span className="text-muted-foreground truncate text-[11px]">
                      — {cleanUrl}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Time Window Tabs & Refresh Button */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
          {windowOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onWindowChange(opt.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedWindow === opt.id
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-7.5 gap-1.5 px-2.5 text-xs font-medium cursor-pointer rounded-lg"
          title="Refresh analytics data"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
