"use client";

import { useGateway } from "@/lib/gateway-context";
import { StatsCard } from "@/components/stats-card";
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

export function StatsGridWidget() {
  const { stats, sessions, cronJobs, status } = useGateway();

  return (
    <div className="grid grid-cols-2 gap-3 h-full p-4">
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
  );
}
