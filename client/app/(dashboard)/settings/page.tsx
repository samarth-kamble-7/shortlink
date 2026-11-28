import { Suspense } from "react";
import { getMyLinksAction } from "@/app/actions/link-actions";
import { getProfileAction, logoutAction } from "@/app/actions/auth-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Shield, Link2, MousePointerClick, Calendar, LogOut } from "lucide-react";

export const metadata = {
  title: "Account Settings — ShortLink",
  description: "Manage your ShortLink account profile and view workspace status.",
};

async function SettingsContent() {
  const [links, userProfile] = await Promise.all([
    getMyLinksAction(),
    getProfileAction(),
  ]);

  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
  const accountId = userProfile?.id ? `usr_${userProfile.id}slnk` : "usr_unknown";
  const userInitial = (userProfile?.fullName?.[0] || userProfile?.email?.[0] || "U").toUpperCase();
  const createdDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active";

  return (
    <DashboardShell links={links} userProfile={userProfile}>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your authenticated profile, workspace overview, and session information.
          </p>
        </div>

        {/* User Profile Card */}
        <Card className="rounded-xl border border-border/80 bg-card/60 shadow-xs backdrop-blur-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              User Profile
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Account identity verified via Spring Boot JWT authentication.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-mono text-xl font-bold shadow-2xs">
                {userInitial}
              </div>
              <div className="space-y-1 min-w-0">
                <p className="font-heading text-base font-semibold text-foreground truncate">
                  {userProfile?.fullName || "Developer"}
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>ID: {accountId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary">
                    <Shield className="h-3 w-3" />
                    {userProfile?.role || "USER"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-border/30">
              <div className="flex items-center gap-3 text-xs">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground">{userProfile?.fullName || "Developer"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Email Address</p>
                  <p className="font-mono text-foreground">{userProfile?.email || "developer@shortlink.io"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Member Since</p>
                  <p className="font-mono text-foreground">{createdDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">Auth Session</p>
                  <p className="font-mono text-emerald-500 font-medium">Valid JWT Access Token</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Workspace Links Summary Card */}
        <Card className="rounded-xl border border-border/80 bg-card/60 shadow-xs backdrop-blur-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="font-heading text-base font-semibold text-foreground">
              Workspace Summary
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Live link inventory and redirection metrics from the PostgreSQL database shard.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 divide-y divide-border/30 text-xs">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Short Links</span>
              </div>
              <span className="font-mono font-semibold text-foreground text-sm tabular-nums">
                {links.length}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Click Volume</span>
              </div>
              <span className="font-mono font-semibold text-foreground text-sm tabular-nums">
                {totalClicks.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Session Sign Out Card */}
        <Card className="rounded-xl border border-border/80 bg-card/60 shadow-xs backdrop-blur-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-foreground">Sign Out of Account</p>
              <p className="text-[11px] text-muted-foreground">
                Revokes your current JWT refresh token and clears session cookies.
              </p>
            </div>
            <form action={async () => {
              "use server";
              await logoutAction();
            }}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="cursor-pointer text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30 shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
