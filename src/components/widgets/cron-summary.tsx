"use client";

import { useGateway } from "@/lib/gateway-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function formatMs(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function CronSummaryWidget() {
  const { cronJobs } = useGateway();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2">
        <p className="text-xs text-muted-foreground">
          {cronJobs.filter((j) => j.enabled).length}/{cronJobs.length} enabled
        </p>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        {cronJobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No cron jobs configured
          </div>
        ) : (
          <div className="space-y-2">
            {cronJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {job.name || job.id}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {job.schedule?.kind === "cron"
                      ? job.schedule.expr
                      : job.schedule?.kind === "every"
                        ? `every ${Math.round(job.schedule.everyMs / 60000)}m`
                        : (job.schedule?.kind ?? "—")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge
                    variant={job.enabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {job.enabled ? "on" : "off"}
                  </Badge>
                  {job.state?.lastRunAtMs && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatMs(job.state.lastRunAtMs)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
