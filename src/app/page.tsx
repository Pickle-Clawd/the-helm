"use client";

import { useGateway } from "@/lib/gateway-context";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, MessageSquare, Wifi, Heart } from "lucide-react";

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatMs(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function shortKey(key: string): string {
  const parts = key.split(":");
  if (parts.length <= 2) return key;
  return parts.slice(2).join(":");
}

export default function OverviewPage() {
  const { stats, cronJobs, sessions, status } = useGateway();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your OpenClaw gateway at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Sessions"
          value={stats.activeSessions || sessions.length}
          subtitle={`${sessions.length} total`}
          icon={MessageSquare}
          gradient
        />
        <StatsCard
          title="Cron Jobs"
          value={stats.totalCronJobs || cronJobs.length}
          subtitle={`${cronJobs.filter((j) => j.enabled).length} enabled`}
          icon={Clock}
        />
        <StatsCard
          title="Uptime"
          value={formatUptime(stats.uptime)}
          subtitle="Since last restart"
          icon={Activity}
        />
        <StatsCard
          title="Connection"
          value={status === "connected" ? "Online" : "Offline"}
          subtitle={status}
          icon={status === "connected" ? Wifi : Heart}
          gradient={status === "connected"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cron Jobs Summary */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Cron Jobs</CardTitle>
            <CardDescription>Scheduled tasks overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {cronJobs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No cron jobs configured
                </div>
              ) : (
                <div className="space-y-3">
                  {cronJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{job.name || job.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.schedule?.kind === "cron" ? job.schedule.expr : job.schedule?.kind === "every" ? `every ${Math.round(job.schedule.everyMs / 60000)}m` : job.schedule?.kind ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Badge variant={job.enabled ? "default" : "secondary"} className="text-xs">
                          {job.enabled ? "on" : "off"}
                        </Badge>
                        {job.state?.lastRunAtMs && (
                          <span className="text-xs text-muted-foreground">
                            {formatMs(job.state.lastRunAtMs)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Active Sessions</CardTitle>
            <CardDescription>Currently running conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {sessions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No active sessions
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(0, 8).map((session) => (
                    <div
                      key={session.key}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {session.label || shortKey(session.key)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {session.lastChannel || session.channel || "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {session.model && (
                          <Badge variant="outline" className="font-mono text-xs">{session.model}</Badge>
                        )}
                        {session.totalTokens !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {session.totalTokens.toLocaleString()} tokens
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-gradient-pink" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Gateway</p>
              <StatusBadge status={status === "connected" ? "connected" : "disconnected"} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Sessions</p>
              <p className="text-sm font-medium">{sessions.length} active</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Cron</p>
              <p className="text-sm font-medium">
                {cronJobs.filter((j) => j.enabled).length}/{cronJobs.length} enabled
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Uptime</p>
              <p className="text-sm font-medium">{formatUptime(stats.uptime)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
