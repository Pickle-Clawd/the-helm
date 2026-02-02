"use client";

import { useGateway } from "@/lib/gateway-context";
import { StatusBadge } from "@/components/status-badge";

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemHealthWidget() {
  const { stats, sessions, cronJobs, status } = useGateway();

  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-full content-center">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Gateway
        </p>
        <StatusBadge
          status={status === "connected" ? "connected" : "disconnected"}
        />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Sessions
        </p>
        <p className="text-sm font-medium">{sessions.length} active</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Cron
        </p>
        <p className="text-sm font-medium">
          {cronJobs.filter((j) => j.enabled).length}/{cronJobs.length} enabled
        </p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Uptime
        </p>
        <p className="text-sm font-medium">{formatUptime(stats.uptime)}</p>
      </div>
    </div>
  );
}
