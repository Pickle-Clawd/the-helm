"use client";

import { useGateway } from "@/lib/gateway-context";
import { ConnectionSetup } from "./connection-setup";
import { DashboardShell } from "./dashboard-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config, status } = useGateway();

  if (!config || (status === "disconnected" && !config)) {
    return <ConnectionSetup />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
