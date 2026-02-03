"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ThemeParticles } from "./theme-particles";
import { CursorBubbles } from "./cursor-bubbles";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-bg" />
      {/* Theme ambient layer — themes can target this via .theme-ambient-layer in styles.css */}
      <div
        className="theme-ambient-layer fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 35 }}
        aria-hidden="true"
      >
        <ThemeParticles />
      </div>
      <CursorBubbles />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn("relative z-10 transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
