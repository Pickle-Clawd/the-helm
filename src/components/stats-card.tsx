"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  gradient?: boolean;
}

export function StatsCard({ title, value, subtitle, icon: Icon, gradient }: StatsCardProps) {
  return (
    <Card className={cn(
      "border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors",
      gradient && "border-gradient-orange/20"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              gradient && "bg-gradient-to-r from-gradient-orange to-gradient-pink bg-clip-text text-transparent"
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            gradient
              ? "bg-gradient-to-br from-gradient-orange/20 to-gradient-pink/20"
              : "bg-muted"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              gradient ? "text-gradient-orange" : "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
