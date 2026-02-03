"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ThemePicker } from "@/components/theme-picker";
import { SettingsDialog } from "@/components/settings-dialog";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/cron", label: "Cron Jobs", icon: Clock },
  { href: "/sessions", label: "Sessions", icon: MessageSquare },
  { href: "/config", label: "Config", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 gap-3 shrink-0">
          <span className="text-2xl shrink-0">🦞</span>
          {!collapsed && (
            <span className="font-bold text-lg text-white">
              The Helm
            </span>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        {/* Bottom section: gateway settings, theme picker, collapse toggle */}
        <div className="p-2 shrink-0 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="w-full justify-center text-muted-foreground hover:text-foreground"
                >
                  <Plug className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Gateway Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="w-full justify-start gap-3 px-3 py-2.5 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <Plug className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Gateway</span>
            </Button>
          )}
          <ThemePicker collapsed={collapsed} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full justify-center text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </TooltipProvider>
  );
}
