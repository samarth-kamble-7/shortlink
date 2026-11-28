import React from "react";
import { Cpu, Zap, Database, Activity, ShieldCheck, Layers } from "lucide-react";

export function ArchitectureShowcase() {
  const pillars = [
    {
      icon: Cpu,
      title: "Twitter Snowflake + Base62",
      badge: "Zero Coordination",
      description:
        "Generates 64-bit, time-ordered, collision-free IDs across distributed worker nodes. Mapped to Base62 to produce compact, tamper-resistant 7-character URLs with zero database locking.",
      metric: "3.5 Trillion URLs",
    },
    {
      icon: Zap,
      title: "Caffeine L1 + Redis L2 Cache",
      badge: "< 5ms P99 Latency",
      description:
        "Two-tier caching hierarchy combining JVM in-memory Caffeine with distributed Redis. Offloads 95%+ of redirect reads from the persistent database with cache-aside TTL invalidation.",
      metric: "99:1 Read/Write Ratio",
    },
    {
      icon: Database,
      title: "PostgreSQL Database Sharding",
      badge: "MurmurHash3 Ring",
      description:
        "Horizontally partitioned storage across multiple PostgreSQL shards. Employs consistent hashing to balance table growth, prevent hot partitions, and eliminate monolithic database bottlenecks.",
      metric: "Multi-Shard HikariCP",
    },
    {
      icon: Activity,
      title: "Kafka Event-Driven Telemetry",
      badge: "Real-Time Streaming",
      description:
        "Click events are published asynchronously to Apache Kafka topics during redirects. A batch streaming consumer enriches events with MaxMind GeoIP locations and device heuristics.",
      metric: "Non-Blocking Ingestion",
    },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>High-Availability Distributed Systems Architecture</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Engineered for Extreme Scale & Reliability
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
          Built from first principles in Java 21, Spring Boot 3, Kafka, Redis, and PostgreSQL to model enterprise-scale redirect backbones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group relative rounded-2xl border border-border/80 bg-card/60 p-6 shadow-xs backdrop-blur-xs transition-all hover:border-border hover:bg-card/90"
            >
              <div className="flex items-start justify-between gap-4 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-2xs group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  {item.badge}
                </span>
              </div>

              <h3 className="font-heading text-base font-semibold text-foreground pt-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                {item.description}
              </p>

              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> Production Ready
                </span>
                <span className="text-foreground font-semibold">{item.metric}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
