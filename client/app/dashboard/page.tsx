"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link2, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutAction();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Sign out failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border/70 bg-card/60 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Link2 className="h-5 w-5" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">
              ShortLink
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/90 p-8 shadow-2xl backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Active Session Authenticated
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">Route Protection:</span>
              <span className="text-emerald-500 font-medium">Active (Middleware Enforced)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              While logged in, visiting <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">/login</code> or <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">/sign-up</code> is automatically prevented by Next.js middleware and redirected back here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full gap-1.5 cursor-pointer text-xs">
                <span>Test /login redirect</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Button
              variant="default"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 gap-2 cursor-pointer text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

