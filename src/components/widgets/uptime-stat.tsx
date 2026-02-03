"use client";

import { useGateway } from "@/lib/gateway-context";
import { formatUptime } from "@/lib/cron-utils";
import { Activity } from "lucide-react";

export function UptimeStatWidget() {
  const { stats } = useGateway();

  return (
    <div className="h-full flex items-center justify-between gap-2 p-4 overflow-hidden">
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[clamp(0.65rem,1.8cqw,0.875rem)] font-medium text-muted-foreground truncate">
          Uptime
        </p>
        <p className="text-[clamp(1.25rem,5cqw,1.875rem)] font-bold tracking-tight leading-tight">
          {formatUptime(stats.uptime)}
        </p>
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground truncate">
          Since last restart
        </p>
      </div>
      <div className="w-[clamp(1.75rem,6cqw,2.5rem)] h-[clamp(1.75rem,6cqw,2.5rem)] rounded-xl flex items-center justify-center shrink-0 bg-muted">
        <Activity className="w-[clamp(0.875rem,3cqw,1.25rem)] h-[clamp(0.875rem,3cqw,1.25rem)] text-muted-foreground" />
      </div>
    </div>
  );
}
