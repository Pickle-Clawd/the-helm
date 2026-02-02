"use client";

import { useState } from "react";
import { useGateway } from "@/lib/gateway-context";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Play, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CronJob, CronSchedule, CronPayload } from "@/lib/gateway-types";

function formatSchedule(schedule: CronSchedule): string {
  if (!schedule || typeof schedule !== "object") return String(schedule ?? "—");
  switch (schedule.kind) {
    case "cron":
      return schedule.expr + (schedule.tz ? ` (${schedule.tz})` : "");
    case "every":
      return `every ${Math.round(schedule.everyMs / 1000 / 60)}m`;
    case "at":
      return `at ${new Date(schedule.atMs).toLocaleString()}`;
    default:
      return JSON.stringify(schedule);
  }
}

function formatPayload(payload: CronPayload): string {
  if (!payload || typeof payload !== "object") return String(payload ?? "—");
  switch (payload.kind) {
    case "systemEvent":
      return payload.text?.slice(0, 80) + (payload.text?.length > 80 ? "…" : "") || "—";
    case "agentTurn":
      return payload.message?.slice(0, 80) + (payload.message?.length > 80 ? "…" : "") || "—";
    default:
      return JSON.stringify(payload);
  }
}

function formatMs(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

export default function CronPage() {
  const { cronJobs, send, refreshCronJobs } = useGateway();
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);

  const toggleJob = async (job: CronJob) => {
    try {
      await send("cron.update", { jobId: job.id, patch: { enabled: !job.enabled } });
      toast.success(`${job.name} ${job.enabled ? "disabled" : "enabled"}`);
      refreshCronJobs();
    } catch (e) {
      toast.error(`Failed to toggle: ${(e as Error).message}`);
    }
  };

  const triggerJob = async (job: CronJob) => {
    try {
      await send("cron.run", { jobId: job.id });
      toast.success(`Triggered ${job.name}`);
    } catch (e) {
      toast.error(`Failed to trigger: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshCronJobs}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No cron jobs found. They may load once connected.
                  </TableCell>
                </TableRow>
              ) : (
                cronJobs.map((job) => (
                  <TableRow key={job.id} className="group">
                    <TableCell className="font-medium">{job.name || job.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {formatSchedule(job.schedule)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {job.sessionTarget}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={job.enabled}
                          onCheckedChange={() => toggleJob(job)}
                          className="scale-90"
                        />
                        <StatusBadge status={job.enabled ? "enabled" : "disabled"} />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatMs(job.state?.lastRunAtMs)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatMs(job.state?.nextRunAtMs)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => triggerJob(job)} title="Trigger now">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)} title="Details">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>{job.name || job.id}</SheetTitle>
                              <SheetDescription>Job configuration</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Schedule</h4>
                                <div className="rounded-lg bg-muted/50 p-3 font-mono text-sm">
                                  {formatSchedule(job.schedule)}
                                </div>
                              </div>
                              <Separator />
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Payload ({job.payload?.kind})</h4>
                                <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap break-all">
                                  {formatPayload(job.payload)}
                                </div>
                              </div>
                              <Separator />
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Details</h4>
                                <div className="rounded-lg bg-muted/50 p-4 font-mono text-xs whitespace-pre-wrap break-all">
                                  {JSON.stringify(job, null, 2)}
                                </div>
                              </div>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
