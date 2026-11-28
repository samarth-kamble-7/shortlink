import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { HeroShortener } from "@/components/home/hero-shortener";
import { ArchitectureShowcase } from "@/components/home/architecture-showcase";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  Server,
  Activity,
  Shield,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "ShortLink — Distributed URL Shortener & Real-Time Analytics",
  description:
    "Enterprise-grade URL shortener engineered with Java 21, Spring Boot 3, Apache Kafka, Redis, and sharded PostgreSQL for sub-millisecond redirection.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl py-14 sm:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3.5 py-1 text-xs font-mono text-muted-foreground shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-foreground">ShortLink v1.0</span>
            <span className="text-border">|</span>
            <span>Distributed URL Redirection & Telemetry</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight sm:leading-tight">
            High-Performance Shortlinks with{" "}
            <span className="text-primary">Real-Time Streaming</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Sub-millisecond redirects powered by Caffeine and Redis L2 caching,
            collision-free Twitter Snowflake 64-bit IDs, horizontal PostgreSQL
            database sharding, and real-time Apache Kafka analytics.
          </p>

          {/* Live Instant Shortening Widget */}
          <div className="pt-4 pb-2">
            <HeroShortener />
          </div>

          {/* Secondary CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button size="sm" className="gap-1.5 text-xs h-9 px-4 cursor-pointer">
                <span>Create Free Account</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 px-4 cursor-pointer">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Open Dashboard</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Live Specs Strip */}
        <section className="mx-auto max-w-5xl border-y border-border/60 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 font-mono text-xs">
            <div className="flex items-center gap-2.5 p-2">
              <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-muted-foreground text-[11px]">Redirect Latency</p>
                <p className="font-bold text-foreground">&lt; 5ms P99 (Caffeine/Redis)</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2">
              <Server className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-muted-foreground text-[11px]">Database Shards</p>
                <p className="font-bold text-foreground">2 PostgreSQL Shards</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2">
              <Activity className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-muted-foreground text-[11px]">Click Pipeline</p>
                <p className="font-bold text-foreground">Kafka Stream Ingestion</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2">
              <Shield className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-muted-foreground text-[11px]">Rate Limiting</p>
                <p className="font-bold text-foreground">1,000 req/min (Redis Lua)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Distributed Architecture Deep Dive */}
        <ArchitectureShowcase />
      </main>

      <Footer />
    </div>
  );
}
