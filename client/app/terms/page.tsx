import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service — ShortLink",
  description: "Terms of Service and acceptable use policy for the ShortLink platform.",
};

export default function TermsPage() {
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
              <Shield className="h-4 w-4" />
              <span>LEGAL AGREEMENT</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Last updated: November 2026 &bull; Production v1.0
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the ShortLink distributed URL redirection platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                2. Acceptable Use Policy
              </h2>
              <p>
                ShortLink is designed for legitimate URL redirection, telemetry analytics, and sharing. You may not use ShortLink for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Phishing, malware distribution, or credential harvesting.</li>
                <li>Transmitting spam, abusive content, or unrequested bulk messaging.</li>
                <li>Attempting to bypass our distributed rate limiting (1,000 req/min per IP) or reverse proxy protections.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                3. Service Availability & SLA
              </h2>
              <p>
                ShortLink operates a multi-node Spring Boot cluster load-balanced via Nginx with automated failover and Caffeine/Redis caching to maintain sub-5ms P99 redirect response times. We reserve the right to revoke links that violate our acceptable use policy.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-heading text-base font-semibold text-foreground">
                4. Account Security
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials. Session authentication is enforced via stateless JWT access tokens and revocable refresh tokens.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
