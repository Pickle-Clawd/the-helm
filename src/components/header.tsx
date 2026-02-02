"use client";

import { useGateway } from "@/lib/gateway-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const { config, status, clearConfig } = useGateway();

  const statusConfig = {
    connected: { label: "Connected", icon: Wifi, className: "bg-success/20 text-success border-success/30" },
    connecting: { label: "Connecting", icon: Loader2, className: "bg-warning/20 text-warning border-warning/30" },
    disconnected: { label: "Disconnected", icon: WifiOff, className: "bg-muted text-muted-foreground border-border" },
    error: { label: "Error", icon: WifiOff, className: "bg-destructive/20 text-destructive border-destructive/30" },
  };

  const s = statusConfig[status];
  const StatusIcon = s.icon;

  return (
    <header className="h-14 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {config?.url?.replace("ws://", "").replace("wss://", "") || "Not configured"}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className={cn("gap-1.5 font-medium", s.className)}>
          <StatusIcon className={cn("w-3 h-3", status === "connecting" && "animate-spin")} />
          {s.label}
        </Badge>
        {config && (
          <Button variant="ghost" size="sm" onClick={clearConfig} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
