"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "success" | "error" | "running" | "enabled" | "disabled" | "connected" | "disconnected";
  label?: string;
}

const styles: Record<string, string> = {
  success: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  error: "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/20",
  running: "bg-warning/15 text-warning border-warning/25 hover:bg-warning/20",
  enabled: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  disabled: "bg-muted text-muted-foreground border-border hover:bg-muted",
  connected: "bg-success/15 text-success border-success/25 hover:bg-success/20",
  disconnected: "bg-destructive/15 text-destructive border-destructive/25 hover:bg-destructive/20",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", styles[status])}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        status === "running" && "animate-pulse",
        (status === "success" || status === "enabled" || status === "connected") && "bg-success",
        (status === "error" || status === "disabled" || status === "disconnected") && "bg-destructive",
        status === "running" && "bg-warning"
      )} />
      {label || status}
    </Badge>
  );
}
