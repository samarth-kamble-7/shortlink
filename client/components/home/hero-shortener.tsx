"use client";

import React, { useState } from "react";
import { createLinkAction } from "@/app/actions/link-actions";
import { LinkItem } from "@/lib/link-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Link2,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  QrCode,
} from "lucide-react";
import { QrCodeBlock } from "@/components/dashboard/qr-code-block";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function HeroShortener() {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    setIsSubmitting(true);
    try {
      const res = await createLinkAction({
        longUrl: targetUrl,
        customAlias: customAlias.trim() || undefined,
      });

      if (res.success && res.link) {
        setCreatedLink(res.link);
        toast.success("Short link generated instantly!");
      } else {
        toast.error(res.error || "Failed to create short link");
      }
    } catch {
      toast.error("Failed to connect to shortlink engine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink.shortUrl);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Shortener Card */}
      <div className="rounded-2xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-lg backdrop-blur-md transition-all hover:border-border">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a long destination URL (e.g. github.com/user/project)"
                className="pl-10 h-11 text-xs sm:text-sm bg-background/90 font-sans border-border/70"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="h-11 px-5 text-xs sm:text-sm font-semibold cursor-pointer shrink-0 gap-2 shadow-xs"
            >
              {isSubmitting ? (
                <span>Generating...</span>
              ) : (
                <>
                  <span>Shorten URL</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Optional Alias Trigger */}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{showOptions ? "Hide custom alias" : "Add custom alias"}</span>
            </button>
            <span className="font-mono text-[11px]">Snowflake 64-bit ID &bull; Base62</span>
          </div>

          {showOptions && (
            <div className="pt-2 border-t border-border/40">
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Custom Alias (Optional)
              </label>
              <div className="flex items-center">
                <span className="flex h-9 items-center rounded-l-lg border border-r-0 border-border/70 bg-muted/50 px-3 text-xs font-mono text-muted-foreground">
                  shortlink-six-nu.vercel.app/
                </span>
                <Input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="my-launch-link"
                  className="h-9 rounded-l-none font-mono text-xs border-border/70"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Generated Result Card */}
      {createdLink && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm backdrop-blur-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-primary truncate">
                  {createdLink.shortUrl}
                </span>
                <span className="rounded bg-primary/10 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono">
                &rarr; {createdLink.longUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQrOpen(true)}
                className="h-8 gap-1 text-xs cursor-pointer"
                title="View QR Code"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">QR Code</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 gap-1 text-xs cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </Button>

              <a
                href={createdLink.shortUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors gap-1"
              >
                <span>Visit</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      {createdLink && (
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
          <DialogContent className="sm:max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading text-base font-bold">
                Scan ShortLink QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <QrCodeBlock url={createdLink.shortUrl} size={220} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
