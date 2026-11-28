import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — ShortLink",
  description: "Privacy policy and telemetry data governance for the ShortLink platform.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Button>
          </Link>

          <div className="space-y-2 border-b border-border/50 pb-6">
            <div className="flex items-center gap-2 text-primary text-xs font-mono">
              <Lock className="h-4 w-4" />
              <span>DATA GOVERNANCE</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Last updated: November 2026 &bull; Production v1.0
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                1. Information We Collect
              </h2>
              <p>
                When you create an account, we collect your name and email address. When visitors click a shortened link, our Apache Kafka ingestion pipeline collects non-personally identifiable telemetry:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Referring domain / acquisition source.</li>
                <li>Device category (Desktop, Mobile, Tablet) and browser family parsed from User-Agent headers.</li>
                <li>Coarse geographical country and city inferred via MaxMind GeoIP databases (raw IP addresses are hashed/discarded).</li>
                <li>Timestamp of redirect events for sliding window analytics.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                2. How We Use Telemetry Data
              </h2>
              <p>
                Telemetry metrics are aggregated in real time via Kafka batch consumers and cached in Redis time-series keys. This allows link creators to analyze traffic volume and geographic reach on their private analytics dashboard.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                3. Cookie Governance
              </h2>
              <p>
                We use secure, HTTP-only session cookies (`shortlink_access_token` and `shortlink_refresh_token`) exclusively for user authentication and authorization. We do not use third-party tracking cookies or advertising pixels.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                4. Data Retention
              </h2>
              <p>
                Link analytics can be viewed across 24-hour, 7-day, 30-day, and all-time sliding windows. Account owners retain the right to delete links at any time, which purges the shortcode, cache entries, and associated telemetry.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
