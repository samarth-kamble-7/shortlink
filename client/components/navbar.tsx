"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground group"
          >
            <Logo size={28} className="transition-transform group-hover:scale-105" />
            <span className="font-mono text-sm font-bold tracking-tight">
              ShortLink
            </span>
          </Link>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-xs">
                  Dashboard
                </Button>
              </Link>
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline-block">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="text-xs"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="text-xs">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
