"use client";

import { useGateway } from "@/lib/gateway-context";
import { formatUptime } from "@/lib/cron-utils";
import { StatusBadge } from "@/components/status-badge";

export function SystemHealthWidget() {
  const { stats, sessions, cronJobs, status } = useGateway();

  return (
    <div className="grid grid-cols-2 gap-[clamp(0.5rem,2cqw,1rem)] p-[clamp(0.75rem,2.5cqw,1rem)] h-full content-center">
      <div className="space-y-[clamp(0.125rem,0.4cqw,0.25rem)]">
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground uppercase tracking-wider">
          Gateway
        </p>
        <StatusBadge
          status={status === "connected" ? "connected" : "disconnected"}
        />
      </div>
      <div className="space-y-[clamp(0.125rem,0.4cqw,0.25rem)]">
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground uppercase tracking-wider">
          Sessions
        </p>
        <p className="text-[clamp(0.7rem,1.8cqw,0.875rem)] font-medium">{sessions.length} active</p>
      </div>
      <div className="space-y-[clamp(0.125rem,0.4cqw,0.25rem)]">
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground uppercase tracking-wider">
          Cron
        </p>
        <p className="text-[clamp(0.7rem,1.8cqw,0.875rem)] font-medium">
          {cronJobs.filter((j) => j.enabled).length}/{cronJobs.length} enabled
        </p>
      </div>
      <div className="space-y-[clamp(0.125rem,0.4cqw,0.25rem)]">
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground uppercase tracking-wider">
          Uptime
        </p>
        <p className="text-[clamp(0.7rem,1.8cqw,0.875rem)] font-medium">{formatUptime(stats.uptime)}</p>
      </div>
    </div>
  );
}
