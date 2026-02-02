import { registerWidget } from "./widget-registry";
import {
  Activity,
  Clock,
  Heart,
  LayoutGrid,
  MessageSquare,
} from "lucide-react";

import { StatsGridWidget } from "@/components/widgets/stats-grid";
import { CronSummaryWidget } from "@/components/widgets/cron-summary";
import { ActiveSessionsWidget } from "@/components/widgets/active-sessions";
import { SystemHealthWidget } from "@/components/widgets/system-health";
import { WelcomeWidget } from "@/components/widgets/welcome";

/* ------------------------------------------------------------------ */
/*  Built-in widgets                                                   */
/* ------------------------------------------------------------------ */

registerWidget({
  id: "stats-grid",
  name: "Stats Overview",
  description: "Key metrics at a glance — sessions, cron, uptime, connection",
  icon: Activity,
  category: "monitoring",
  defaultSize: { w: 12, h: 6 },
  minSize: { w: 8, h: 5 },
  component: StatsGridWidget,
});

registerWidget({
  id: "cron-summary",
  name: "Cron Jobs",
  description: "Scrollable list of all scheduled tasks with status",
  icon: Clock,
  category: "data",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: CronSummaryWidget,
});

registerWidget({
  id: "active-sessions",
  name: "Active Sessions",
  description: "Live view of running conversations and their models",
  icon: MessageSquare,
  category: "data",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: ActiveSessionsWidget,
});

registerWidget({
  id: "system-health",
  name: "System Health",
  description: "Gateway status, session count, cron health, uptime",
  icon: Heart,
  category: "monitoring",
  defaultSize: { w: 12, h: 5 },
  minSize: { w: 6, h: 4 },
  component: SystemHealthWidget,
});

registerWidget({
  id: "welcome",
  name: "Welcome",
  description: "Getting started guide for your dashboard",
  icon: LayoutGrid,
  category: "utility",
  defaultSize: { w: 12, h: 8 },
  minSize: { w: 8, h: 6 },
  component: WelcomeWidget,
});
