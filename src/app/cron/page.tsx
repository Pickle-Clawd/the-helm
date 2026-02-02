"use client";

import { useState } from "react";
import { useGateway } from "@/lib/gateway-context";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, History, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { CronJob } from "@/lib/gateway-types";

function formatTime(ts?: string): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ts; }
}

export default function CronPage() {
  const { cronJobs, send, refreshCronJobs } = useGateway();
  const [creating, setCreating] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [newJob, setNewJob] = useState({ name: "", schedule: "", command: "" });

  const toggleJob = async (job: CronJob) => {
    try {
      await send("cron.toggle", { name: job.name, enabled: !job.enabled });
      toast.success(`${job.name} ${job.enabled ? "disabled" : "enabled"}`);
      refreshCronJobs();
    } catch (e) {
      toast.error(`Failed to toggle: ${(e as Error).message}`);
    }
  };

  const triggerJob = async (name: string) => {
    try {
      await send("cron.trigger", { name });
      toast.success(`Triggered ${name}`);
      refreshCronJobs();
    } catch (e) {
      toast.error(`Failed to trigger: ${(e as Error).message}`);
    }
  };

  const createJob = async () => {
    if (!newJob.name || !newJob.schedule) {
      toast.error("Name and schedule are required");
      return;
    }
    try {
      await send("cron.create", {
        name: newJob.name,
        schedule: newJob.schedule,
        command: newJob.command,
      });
      toast.success(`Created job: ${newJob.name}`);
      setCreating(false);
      setNewJob({ name: "", schedule: "", command: "" });
      refreshCronJobs();
    } catch (e) {
      toast.error(`Failed to create: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage scheduled tasks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshCronJobs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-gradient-orange to-gradient-pink text-white hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Cron Job</DialogTitle>
                <DialogDescription>Add a new scheduled task to the gateway</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="my-job"
                    value={newJob.name}
                    onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Schedule (cron expression)</Label>
                  <Input
                    placeholder="*/5 * * * *"
                    value={newJob.schedule}
                    onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Command</Label>
                  <Textarea
                    placeholder="Command or prompt to run"
                    value={newJob.command}
                    onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                <Button onClick={createJob}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No cron jobs configured. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                cronJobs.map((job) => (
                  <TableRow key={job.name} className="group">
                    <TableCell className="font-medium">{job.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {job.schedule}
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
                      {formatTime(job.lastRun)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTime(job.nextRun)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => triggerJob(job.name)} title="Trigger now">
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
                              <SheetTitle>{job.name}</SheetTitle>
                              <SheetDescription>Job configuration and history</SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Configuration</h4>
                                <div className="rounded-lg bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap break-all">
                                  {JSON.stringify(job.config || { schedule: job.schedule, command: job.command }, null, 2)}
                                </div>
                              </div>
                              <Separator />
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                  <History className="w-4 h-4" />
                                  Run History
                                </h4>
                                <ScrollArea className="h-[300px]">
                                  {(job.history || []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No run history</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {(job.history || []).map((h, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                                          <StatusBadge status={h.status} />
                                          <span className="text-xs text-muted-foreground">{formatTime(h.timestamp)}</span>
                                          {h.duration && <span className="text-xs text-muted-foreground">{h.duration}ms</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </ScrollArea>
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
