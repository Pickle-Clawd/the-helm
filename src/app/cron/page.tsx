"use client";

import { useState, useMemo, useEffect } from "react";
import { useGateway } from "@/lib/gateway-context";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, RefreshCw, Plus, MoreHorizontal, Pencil, Trash2, Copy, History, Search } from "lucide-react";
import { toast } from "sonner";
import {
  formatScheduleHuman,
  formatScheduleRaw,
  formatCountdown,
  formatTimestamp,
  formatTimeAgo,
} from "@/lib/cron-utils";
import { CronJobDialog } from "./cron-job-dialog";
import { RunHistoryDialog } from "./run-history-dialog";
import type { CronJob } from "@/lib/gateway-types";

type FilterStatus = "all" | "enabled" | "disabled";
type FilterTarget = "all" | "main" | "isolated";

import { getModelBadgeClass, shortModel } from "@/lib/model-utils";

export default function CronPage() {
  const { cronJobs, send, refreshCronJobs } = useGateway();

  // Filter/search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterTarget, setFilterTarget] = useState<FilterTarget>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "duplicate">("create");
  const [dialogJob, setDialogJob] = useState<CronJob | null>(null);

  // Delete confirmation
  const [deleteJob, setDeleteJob] = useState<CronJob | null>(null);

  // Run history
  const [historyJob, setHistoryJob] = useState<CronJob | null>(null);

  // Countdown ticker
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Sort and filter jobs
  const filteredJobs = useMemo(() => {
    let jobs = [...cronJobs];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.name?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          (j.payload?.kind === "agentTurn" ? (j.payload as { message?: string }).message ?? "" : (j.payload as { text?: string }).text ?? "").toLowerCase().includes(q)
      );
    }

    // Filter by enabled/disabled
    if (filterStatus === "enabled") jobs = jobs.filter((j) => j.enabled);
    if (filterStatus === "disabled") jobs = jobs.filter((j) => !j.enabled);

    // Filter by target
    if (filterTarget !== "all") jobs = jobs.filter((j) => j.sessionTarget === filterTarget);

    // Sort: enabled first, then by name
    jobs.sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return jobs;
  }, [cronJobs, searchQuery, filterStatus, filterTarget]);

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

  const handleDelete = async () => {
    if (!deleteJob) return;
    try {
      await send("cron.remove", { jobId: deleteJob.id });
      toast.success(`Deleted "${deleteJob.name}"`);
      refreshCronJobs();
    } catch (e) {
      toast.error(`Failed to delete: ${(e as Error).message}`);
    }
    setDeleteJob(null);
  };

  const openCreate = () => {
    setDialogJob(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (job: CronJob) => {
    setDialogJob(job);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const openDuplicate = (job: CronJob) => {
    setDialogJob(job);
    setDialogMode("duplicate");
    setDialogOpen(true);
  };

  const getLastRunStatusColor = (job: CronJob): "success" | "error" | "disabled" => {
    const status = job.state?.lastRunStatus;
    if (!status) return "disabled";
    if (status === "success" || status === "ok") return "success";
    if (status === "error" || status === "failed") return "error";
    return "disabled";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Manage scheduled tasks
              {cronJobs.length > 0 && (
                <span className="ml-2 text-xs">
                  ({cronJobs.filter((j) => j.enabled).length} active / {cronJobs.length} total)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshCronJobs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by name or payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="enabled">Enabled</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTarget} onValueChange={(v) => setFilterTarget(v as FilterTarget)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="isolated">Isolated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      {cronJobs.length === 0
                        ? "No cron jobs found. They may load once connected."
                        : "No jobs match your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const lastRunColor = getLastRunStatusColor(job);
                    return (
                      <TableRow
                        key={job.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${!job.enabled ? "opacity-50" : ""}`}
                        onClick={() => openEdit(job)}
                      >
                        {/* Enable/Disable toggle */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={job.enabled}
                            onCheckedChange={() => toggleJob(job)}
                            className="scale-90"
                          />
                        </TableCell>

                        {/* Name + model */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium">{job.name || job.id}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                                {job.payload?.kind === "agentTurn" ? "agent" : "system"}
                              </Badge>
                              {(() => {
                                const model = job.payload?.kind === "agentTurn" ? (job.payload as { model?: string }).model : undefined;
                                return (
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-mono font-normal ${getModelBadgeClass(model)}`}>
                                    {shortModel(model)}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>

                        {/* Schedule - human readable + raw */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-0.5">
                                <div className="text-sm">
                                  {formatScheduleHuman(job.schedule)}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {formatScheduleRaw(job.schedule)}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatScheduleRaw(job.schedule)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Target */}
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {job.sessionTarget}
                          </Badge>
                        </TableCell>

                        {/* Last Run with color-coded status + relative time */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                lastRunColor === "success"
                                  ? "bg-success"
                                  : lastRunColor === "error"
                                    ? "bg-destructive"
                                    : "bg-muted-foreground/30"
                              }`}
                            />
                            <div className="space-y-0.5">
                              <div className="text-sm text-muted-foreground">
                                {formatTimestamp(job.state?.lastRunAtMs)}
                              </div>
                              {job.state?.lastRunAtMs && (
                                <div className="text-[11px] text-muted-foreground/60">
                                  {formatTimeAgo(job.state.lastRunAtMs)}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Next Run with countdown */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-sm text-muted-foreground">
                              {formatTimestamp(job.state?.nextRunAtMs)}
                            </div>
                            {job.state?.nextRunAtMs && job.enabled && (
                              <div className="text-[11px] text-primary font-medium">
                                {formatCountdown(job.state.nextRunAtMs)}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions - always visible */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => triggerJob(job)}
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Run now</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(job)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDuplicate(job)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setHistoryJob(job)}>
                                  <History className="w-4 h-4 mr-2" />
                                  Run History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteJob(job)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <CronJobDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          job={dialogJob}
          mode={dialogMode}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteJob} onOpenChange={(open) => !open && setDeleteJob(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{deleteJob?.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the cron job
                and all its run history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Run History Dialog */}
        {historyJob && (
          <RunHistoryDialog
            open={!!historyJob}
            onOpenChange={(open) => !open && setHistoryJob(null)}
            jobId={historyJob.id}
            jobName={historyJob.name}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
