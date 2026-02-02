# MODULE.md — Widget Module System

How to create widget modules for The Helm dashboard. Read this entire file before writing any code.

---

## Understanding OpenClaw

The Helm is a dashboard for **OpenClaw** — an open-source AI agent gateway. You need to understand what OpenClaw is and what data it exposes.

### What is OpenClaw?

OpenClaw is a local daemon that acts as a gateway between AI models (Claude, GPT, Gemini, etc.) and messaging channels (Discord, Telegram, Signal, etc.). It runs on the user's machine and manages:

- **Sessions** — Conversations between users and AI agents. Each session tracks the model being used, token consumption, the channel it's connected to, and message history.
- **Cron Jobs** — Scheduled tasks that fire on intervals or cron expressions. They can inject system events into sessions or spawn isolated agent runs.
- **Agents** — AI agent configurations. An agent has a model, system prompt, tools, and skills.
- **Channels** — Messaging integrations (Discord, Telegram, Slack, WhatsApp, Signal, iMessage, Google Chat).
- **Gateway Config** — The central configuration file that defines agents, channels, tools, permissions, and behavior.

### The Gateway WebSocket

The Helm connects to the OpenClaw gateway via a **WebSocket** using **JSON-RPC 2.0**. When the user enters their gateway URL and token, The Helm opens a persistent connection and can:

1. **Subscribe to real-time updates** — Session changes, cron job runs, connection status
2. **Query data** — List sessions, cron jobs, config
3. **Send commands** — Run cron jobs, manage sessions, update config

All gateway data flows through the `useGateway()` hook, which maintains the WebSocket connection and provides reactive state.

### Data Model

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

#### Cron Jobs

Cron jobs are scheduled tasks. They can run on fixed intervals, cron expressions, or one-shot at a specific time.

```tsx
type CronSchedule =
  | { kind: "at"; atMs: number }                           // One-shot at timestamp
  | { kind: "every"; everyMs: number; anchorMs?: number }  // Recurring interval
  | { kind: "cron"; expr: string; tz?: string };           // Cron expression

type CronPayload =
  | { kind: "systemEvent"; text: string }                   // Inject text into main session
  | { kind: "agentTurn"; message: string; model?: string }; // Spawn isolated agent run

interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  deleteAfterRun?: boolean;
  createdAtMs: number;
  updatedAtMs: number;
  schedule: CronSchedule;
  sessionTarget: "main" | "isolated";
  wakeMode: "next-heartbeat" | "now";
  payload: CronPayload;
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    nextRunAtMs?: number;
  };
}
```

#### Gateway Stats

```tsx
interface GatewayStats {
  activeSessions: number;
  totalCronJobs: number;
  uptime: number;          // seconds
  connected: boolean;
}
```

#### Session Messages

When fetching history via `sessions.history`:

```tsx
interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; thinking?: string }>;
  timestamp?: number;
  model?: string;
}
```

#### Gateway Config

The raw gateway configuration (JSON string). Contains agent definitions, channel configs, tool policies, and more. Access via `rawConfig` from `useGateway()`.

### Available RPC Methods

Called via `send(method, params)` from the `useGateway()` hook:

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
| `config.patch` | `{ patch }` | `{ ok }` | Patch config (triggers restart!) |
| `status` | `{}` | `object` | Get gateway status |

> RPC methods may evolve with OpenClaw versions. Handle errors gracefully.

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
│   ├── widget-wrapper.tsx    ← Chrome/frame around each widget (auto-applied)
│   ├── widget-grid.tsx       ← Main grid layout engine
│   └── widget-catalog.tsx    ← "Add Widget" picker dialog
```

---

## Creating a Widget

### Two things are required:

1. **A component** in `src/components/widgets/` — a React component with `"use client"` directive
2. **A registration call** in `src/lib/register-widgets.ts` — tells the system about your widget

### Registration API

```tsx
import { registerWidget } from "./widget-registry";

registerWidget({
  id: string,                    // Unique ID, kebab-case
  name: string,                  // Display name shown in catalog
  description: string,           // One-line description for the widget picker
  icon: LucideIcon,              // Any icon from lucide-react
  category: "monitoring" | "data" | "utility" | "custom",
  defaultSize: { w: number, h: number },  // Initial grid size
  minSize: { w: number, h: number },      // Minimum resize dimensions
  maxSize?: { w: number, h: number },     // Optional maximum
  component: ComponentType,               // Your React component
});
```

### Component Props

Your component receives these props (optional to use):

```tsx
interface WidgetComponentProps {
  instanceId: string;  // Unique ID for this placed instance
  editMode: boolean;   // Whether the dashboard is in edit mode
}
```

### Accessing Data

```tsx
import { useGateway } from "@/lib/gateway-context";

const {
  status,             // "connected" | "disconnected" | "connecting" | "error"
  stats,              // GatewayStats
  cronJobs,           // CronJob[]
  sessions,           // Session[]
  rawConfig,          // string (full gateway config JSON)
  config,             // { url, token }
  send,               // (method, params?) => Promise<unknown>
  refreshCronJobs,    // () => void
  refreshSessions,    // () => void
  refreshStats,       // () => void
  refreshConfig,      // () => void
} = useGateway();
```

---

## Rules

### Layout
- Root element **must** have `h-full` — widget fills its container
- The header bar (icon, name, drag handle, remove button) is added automatically — don't recreate it
- Use `ScrollArea` from `@/components/ui/scroll-area` for scrollable content
- Design for `minSize` first, then enhance for larger sizes

### Styling
- Use **theme tokens only** — no hardcoded colors
  - Backgrounds: `bg-card`, `bg-muted`, `bg-primary`, `bg-background`
  - Text: `text-foreground`, `text-muted-foreground`, `text-primary`
  - Borders: `border-border`
  - Status: `text-success`, `text-warning`, `text-destructive`
- The widget wrapper provides the card frame — don't wrap in another Card
- Common row pattern: `p-2.5 rounded-lg bg-muted/50`

### Available UI Components (shadcn/ui)

Import from `@/components/ui/`:
`Badge`, `Button`, `Card`, `ScrollArea`, `Tabs`, `Tooltip`, `Dialog`, `Progress`, `Select`, `Separator`, `Switch`, `Label`, `Popover`, `AlertDialog`, `Collapsible`

### Grid System

24-column grid, ~30px row height.

| Columns | Width | Use Case |
|---------|-------|----------|
| 6 | ¼ page | Compact stat |
| 12 | ½ page | Standard widget |
| 18 | ¾ page | Wide content |
| 24 | Full | Full-width panel |

| Rows | Height | Use Case |
|------|--------|----------|
| 4 | ~120px | Compact |
| 6 | ~180px | Small card |
| 8 | ~240px | Medium |
| 10 | ~300px | List with scroll |
| 14 | ~420px | Large panel |

### Categories

| Category | For |
|----------|-----|
| `"monitoring"` | Real-time status, metrics, health |
| `"data"` | Lists, tables, data views |
| `"utility"` | Tools, helpers, non-data widgets |
| `"custom"` | Everything else |

---

## Tech Stack

- **Next.js 16** (App Router) / **React 19**
- **Tailwind CSS v4** — theme via CSS variables
- **shadcn/ui** — Radix-based component library
- **lucide-react** — Icons
- **react-grid-layout v2** — Drag/resize grid
- **recharts** — Charts (already installed)
- **Themes** — folder-based in `public/themes/`, CSS variables in `src/app/globals.css`

---

## Checklist

- [ ] Component in `src/components/widgets/` with `"use client"`
- [ ] Registered in `src/lib/register-widgets.ts`
- [ ] Unique kebab-case `id`
- [ ] `h-full` on root element
- [ ] Theme tokens only (no hardcoded colors)
- [ ] Scrollable content uses `ScrollArea`
- [ ] Sensible `defaultSize` and `minSize`
- [ ] Works at minimum size without breaking
- [ ] Errors handled gracefully (gateway disconnected, empty data, etc.)
