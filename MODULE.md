# MODULE.md — Widget Module System

This document explains how to create custom widgets (modules) for The Helm dashboard. It's designed so an AI coding agent (like Claude Code) or a human developer can create a new widget from scratch in under 5 minutes.

---

## Understanding OpenClaw

The Helm is a dashboard for **OpenClaw** — an open-source AI agent gateway. Before building widgets, you need to understand what OpenClaw is and what data it exposes.

### What is OpenClaw?

OpenClaw is a local daemon that acts as a gateway between AI models (Claude, GPT, Gemini, etc.) and messaging channels (Discord, Telegram, Signal, etc.). It runs on the user's machine and manages:

- **Sessions** — Conversations between users and AI agents. Each session tracks the model being used, token consumption, the channel it's connected to, and message history.
- **Cron Jobs** — Scheduled tasks that fire on intervals or cron expressions. They can inject system events into sessions or spawn isolated agent runs.
- **Agents** — AI agent configurations. An agent has a model, system prompt, tools, and skills.
- **Channels** — Messaging integrations (Discord, Telegram, Slack, WhatsApp, Signal, iMessage, Google Chat).
- **Gateway Config** — The central configuration file that defines agents, channels, tools, permissions, and behavior.

### The Gateway WebSocket

The Helm connects to the OpenClaw gateway via a **WebSocket** using **JSON-RPC 2.0**. When the user enters their gateway URL (e.g. `ws://localhost:18789`) and token, The Helm opens a persistent connection and can:

1. **Subscribe to real-time updates** — Session changes, cron job runs, connection status
2. **Query data** — List sessions, cron jobs, config
3. **Send commands** — Run cron jobs, manage sessions, update config

All gateway data in The Helm flows through the `useGateway()` hook, which maintains the WebSocket connection and provides reactive state.

### Data Model Deep Dive

#### Sessions

A session represents an active or recent conversation. Sessions are keyed by a string like `main`, `discord:channel:123456`, or `cron:job-uuid`.

```tsx
interface Session {
  key: string;              // Unique session key
  kind?: string;            // Session type (e.g. "main", "cron", "channel")
  channel?: string;         // Channel plugin (e.g. "discord", "telegram")
  label?: string;           // Human-readable label
  displayName?: string;     // Display name override
  model?: string;           // AI model in use (e.g. "claude-sonnet-4-5")
  totalTokens?: number;     // Total tokens consumed
  contextTokens?: number;   // Current context window usage
  updatedAt?: number;       // Last activity timestamp (unix ms)
  lastChannel?: string;     // Last channel that sent a message
}
```

**Widget ideas:** Token usage tracker, session timeline, model distribution chart, active conversation monitor.

#### Cron Jobs

Cron jobs are scheduled tasks. They can run on fixed intervals, cron expressions, or one-shot at a specific time.

```tsx
// Schedule types
type CronSchedule =
  | { kind: "at"; atMs: number }                           // One-shot at timestamp
  | { kind: "every"; everyMs: number; anchorMs?: number }  // Recurring interval
  | { kind: "cron"; expr: string; tz?: string };           // Cron expression

// Payload types — what happens when the job fires
type CronPayload =
  | { kind: "systemEvent"; text: string }                   // Inject text into main session
  | { kind: "agentTurn"; message: string; model?: string; /*...*/ }; // Spawn isolated agent run

interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  deleteAfterRun?: boolean;     // One-shot jobs that self-delete
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: "main" | "isolated";  // Where the job runs
  wakeMode: "next-heartbeat" | "now";  // When to wake the agent
  payload: CronPayload;
  state: {
    lastRunAtMs?: number;       // When it last ran
    lastRunStatus?: string;     // "ok" | "error" | etc.
    nextRunAtMs?: number;       // When it will run next
  };
}
```

**Widget ideas:** Cron timeline/calendar view, next-run countdown, job run history, failed jobs alert panel.

#### Gateway Stats

Aggregate stats about the running gateway.

```tsx
interface GatewayStats {
  activeSessions: number;    // Currently active sessions
  totalCronJobs: number;     // Total cron jobs configured
  uptime: number;            // Gateway uptime in seconds
  connected: boolean;        // Whether The Helm is connected
}
```

#### Gateway Config

The raw gateway configuration (JSON). Contains agent definitions, channel configs, tool policies, and more. Access via `rawConfig` (string) from `useGateway()`.

**Widget ideas:** Config diff viewer, agent list, channel status panel, tool inventory.

### Available RPC Methods

These methods can be called via `send(method, params)` from the `useGateway()` hook:

| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| `cron.list` | `{}` | `CronJob[]` | List all cron jobs |
| `cron.add` | `{ job }` | `{ jobId }` | Create a new cron job |
| `cron.update` | `{ jobId, patch }` | `{ ok }` | Update a cron job |
| `cron.remove` | `{ jobId }` | `{ ok }` | Delete a cron job |
| `cron.run` | `{ jobId }` | `{ ok }` | Trigger a job immediately |
| `cron.runs` | `{ jobId }` | `Run[]` | Get run history for a job |
| `sessions.list` | `{ limit?, kinds? }` | `Session[]` | List active sessions |
| `sessions.history` | `{ sessionKey, limit? }` | `Message[]` | Get message history |
| `sessions.send` | `{ sessionKey, message }` | `{ ok }` | Send a message to a session |
| `config.get` | `{}` | `object` | Get full gateway config |
| `config.patch` | `{ patch }` | `{ ok }` | Patch config (triggers restart) |
| `status` | `{}` | `object` | Get gateway status |

> **Note:** RPC methods may evolve with OpenClaw versions. If a method returns an error, handle it gracefully.

### Session Message Format

When fetching history via `sessions.history`, messages look like:

```tsx
interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; thinking?: string }>;
  timestamp?: number;
  model?: string;
}
```

**Widget ideas:** Chat history viewer, conversation search, message analytics.

---

## File Structure

```
src/
├── lib/
│   ├── widget-registry.ts    ← Widget type definitions + registry
│   ├── register-widgets.ts   ← All widget registrations (add yours here)
│   └── gateway-context.tsx   ← Gateway data hook (useGateway)
├── components/
│   ├── widgets/              ← Widget components live here
│   │   ├── stats-grid.tsx
│   │   ├── cron-summary.tsx
│   │   ├── active-sessions.tsx
│   │   ├── system-health.tsx
│   │   └── welcome.tsx
│   ├── widget-wrapper.tsx    ← Chrome/frame around each widget
│   ├── widget-grid.tsx       ← Main grid layout engine
│   └── widget-catalog.tsx    ← "Add Widget" picker dialog
```

The homepage (`src/app/page.tsx`) imports `register-widgets.ts` then renders `<WidgetGrid />`. That's it.

---

## Quick Start: Create a Widget in 3 Steps

### Step 1: Create the Component

Create a new file in `src/components/widgets/`. Your component receives no special props — just render your UI. Use `useGateway()` to access live gateway data.

```tsx
// src/components/widgets/my-widget.tsx
"use client";

import { useGateway } from "@/lib/gateway-context";

export function MyWidget() {
  const { sessions, cronJobs, stats, status } = useGateway();

  return (
    <div className="p-4 h-full">
      <p className="text-sm text-muted-foreground">
        {sessions.length} sessions running
      </p>
    </div>
  );
}
```

### Step 2: Register It

Add your widget to `src/lib/register-widgets.ts`:

```tsx
import { registerWidget } from "./widget-registry";
import { Zap } from "lucide-react";  // pick any lucide icon
import { MyWidget } from "@/components/widgets/my-widget";

registerWidget({
  id: "my-widget",                    // unique ID (kebab-case)
  name: "My Widget",                  // display name in catalog
  description: "Does something cool", // shown in the widget picker
  icon: Zap,                          // lucide-react icon component
  category: "monitoring",             // "monitoring" | "data" | "utility" | "custom"
  defaultSize: { w: 12, h: 8 },      // grid units (24 columns, ~30px rows)
  minSize: { w: 6, h: 4 },           // minimum resize dimensions
  component: MyWidget,                // your component
});
```

### Step 3: Done

That's it. Your widget appears in the "Add Widget" catalog, ready to be dragged onto the dashboard.

---

## Widget Component Contract

### Props

Your component receives these props (via `WidgetComponentProps`), but you can ignore them if you don't need them:

```tsx
interface WidgetComponentProps {
  instanceId: string;  // Unique ID for this placed instance
  editMode: boolean;   // Whether the dashboard is in edit mode
}
```

### Layout Rules

- Your component fills the **entire widget body** (below the header bar)
- The header bar (icon, title, drag handle, remove button) is added automatically by `WidgetWrapper`
- Use `h-full` on your root element to fill the available space
- Use `overflow-hidden` or `ScrollArea` for scrollable content
- The widget can be **any size** — design responsively

### Styling

- Use Tailwind CSS classes with **theme tokens** (not hardcoded colors):
  - `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`
  - `border-border`, `bg-primary`, `text-primary`
- Existing card pattern: `border-border/50 bg-card/80 backdrop-blur-sm`
- Item rows: `p-2.5 rounded-lg bg-muted/50`
- The widget wrapper already provides the card frame — don't add another Card inside

### Available UI Components

From `src/components/ui/` (shadcn/ui):

- `Badge` — status labels
- `Button` — actions
- `Card` — sub-cards (if needed)
- `ScrollArea` — scrollable regions
- `Tabs` — tabbed views
- `Tooltip` — hover info
- `Dialog` — modals
- `Progress` — progress bars
- `Select` — dropdowns

---

## Accessing Gateway Data

Use the `useGateway()` hook to access all live data:

```tsx
import { useGateway } from "@/lib/gateway-context";

const {
  status,       // "connected" | "disconnected" | "connecting" | "error"
  stats,        // { activeSessions, totalCronJobs, uptime, connected }
  cronJobs,     // CronJob[] — all cron jobs with schedule, status, last run
  sessions,     // Session[] — active sessions with model, tokens, channel
  rawConfig,    // string — raw gateway config JSON
  config,       // { url, token } — gateway connection info
  send,         // (method, params?) => Promise — send RPC to gateway
  refreshCronJobs,   // () => void — force refresh
  refreshSessions,   // () => void
  refreshStats,      // () => void
  refreshConfig,     // () => void
} = useGateway();
```

### Key Types

```tsx
interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: CronSchedule;     // { kind: "cron", expr } | { kind: "every", everyMs } | { kind: "at", atMs }
  sessionTarget: "main" | "isolated";
  payload: CronPayload;       // { kind: "systemEvent", text } | { kind: "agentTurn", message, ... }
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    nextRunAtMs?: number;
  };
}

interface Session {
  key: string;
  kind?: string;
  channel?: string;
  label?: string;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  updatedAt?: number;
}

interface GatewayStats {
  activeSessions: number;
  totalCronJobs: number;
  uptime: number;
  connected: boolean;
}
```

### Sending RPC Commands

Use `send()` to call gateway methods:

```tsx
// List cron jobs
const jobs = await send("cron.list", {});

// Get session history
const history = await send("sessions.history", { sessionKey: "main", limit: 10 });

// Run a cron job
await send("cron.run", { jobId: "some-job-id" });
```

---

## Grid System

The dashboard uses a **24-column grid** with ~30px row height:

| Size | Columns | Rough Width | Good For |
|------|---------|-------------|----------|
| Small | 6 | ¼ page | Single stat, icon |
| Medium | 12 | ½ page | Lists, charts |
| Large | 18 | ¾ page | Wide tables |
| Full | 24 | Full width | Dashboards, timelines |

Row heights:
- `h: 4` ≈ 120px — compact stat
- `h: 6` ≈ 180px — card with a few items
- `h: 8` ≈ 240px — medium content
- `h: 10` ≈ 300px — scrollable list
- `h: 14` ≈ 420px — large panel

### Size Tips

- `defaultSize` — what the widget starts at when added
- `minSize` — smallest it can be resized to
- `maxSize` — (optional) largest it can grow
- Design for the `minSize` first, then make it look better at larger sizes

---

## Widget Categories

| Category | Description | Examples |
|----------|-------------|---------|
| `"monitoring"` | Real-time status & metrics | Health, stats, connection |
| `"data"` | Lists & data views | Cron jobs, sessions, logs |
| `"utility"` | Tools & helpers | Welcome, notes, clock |
| `"custom"` | User-created widgets | Anything else |

---

## Example: Full Widget

Here's a complete example — a "Token Usage" widget showing per-session token consumption:

```tsx
// src/components/widgets/token-usage.tsx
"use client";

import { useGateway } from "@/lib/gateway-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function TokenUsageWidget() {
  const { sessions } = useGateway();

  const sorted = [...sessions]
    .filter((s) => s.totalTokens && s.totalTokens > 0)
    .sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0));

  const total = sorted.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total.toLocaleString()} total tokens
        </p>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {sorted.map((session) => {
            const pct = total > 0 ? ((session.totalTokens ?? 0) / total) * 100 : 0;
            return (
              <div
                key={session.key}
                className="p-2.5 rounded-lg bg-muted/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {session.label || session.key.split(":").pop()}
                  </p>
                  <Badge variant="outline" className="text-xs font-mono">
                    {(session.totalTokens ?? 0).toLocaleString()}
                  </Badge>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
```

Register it:

```tsx
// In src/lib/register-widgets.ts
import { Coins } from "lucide-react";
import { TokenUsageWidget } from "@/components/widgets/token-usage";

registerWidget({
  id: "token-usage",
  name: "Token Usage",
  description: "Token consumption breakdown by session",
  icon: Coins,
  category: "monitoring",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: TokenUsageWidget,
});
```

---

## Tech Stack Reference

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives)
- **Icons**: lucide-react
- **Grid**: react-grid-layout v2
- **Charts**: recharts (already installed)
- **Theme**: CSS variables — see `src/app/globals.css` and `public/themes/`

---

## Widget Ideas

Here are some widget concepts that could be built using the available data:

**Monitoring:**
- Token usage breakdown (per-session bar chart)
- Model distribution (pie chart of which models are active)
- Connection uptime tracker (historical uptime percentage)
- Cost estimator (token counts × model pricing)

**Data:**
- Cron calendar (visual timeline of scheduled jobs)
- Next run countdown (live timers for upcoming cron jobs)
- Failed jobs alert panel (highlight jobs with error status)
- Session history viewer (browse past conversations)
- Config diff viewer (show recent config changes)

**Utility:**
- Quick actions panel (buttons to run cron jobs, restart gateway)
- Markdown notepad (scratchpad that persists in localStorage)
- Clock / timezone display
- Changelog / release notes viewer
- Keyboard shortcut reference

**Advanced:**
- Agent chat widget (send messages to sessions directly from dashboard)
- Log stream (real-time gateway event feed)
- Custom API widget (fetch and display data from any URL)
- Cron job builder (create/edit cron jobs with a visual editor)

---

## Checklist for New Widgets

- [ ] Create component in `src/components/widgets/`
- [ ] Add `"use client"` directive at top
- [ ] Use `useGateway()` for data (if needed)
- [ ] Use theme tokens for colors (no hardcoded values)
- [ ] Root element has `h-full` for proper sizing
- [ ] Scrollable content uses `ScrollArea`
- [ ] Register in `src/lib/register-widgets.ts`
- [ ] Pick a unique `id` (kebab-case)
- [ ] Set sensible `defaultSize` and `minSize`
- [ ] Pick an appropriate `category`
- [ ] Test at minimum size to ensure it doesn't break
