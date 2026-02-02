"use client";

import { useGateway } from "@/lib/gateway-context";
import { StatsCard } from "@/components/stats-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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

function formatTime(ts?: string): string {
  if (!ts) return "—";
  try {
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default function OverviewPage() {
  const { stats, cronJobs, sessions, status } = useGateway();

  // Get recent cron runs from all jobs
  const recentRuns = cronJobs
    .flatMap((job) =>
      (job.history || []).map((h) => ({ ...h, jobName: job.name }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

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
        {/* Recent Cron Runs */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Cron Runs</CardTitle>
            <CardDescription>Latest job executions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {recentRuns.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No cron run history yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRuns.map((run, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{run.jobName}</TableCell>
                        <TableCell>
                          <StatusBadge status={run.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatTime(run.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{session.key}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {session.lastMessage || "No messages"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        {session.model && (
                          <p className="text-xs text-muted-foreground">{session.model}</p>
                        )}
                        {session.tokens !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {session.tokens.toLocaleString()} tokens
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
