export interface GatewayConfig {
  url: string;
  token: string;
}

export interface GatewayMessage {
  type?: string;
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
  ok?: boolean;
  payload?: unknown;
  error?: { code?: string; message: string };
  event?: string;
}

// Cron types matching OpenClaw's real API
export type CronSchedule =
  | { kind: "at"; atMs: number }
  | { kind: "every"; everyMs: number; anchorMs?: number }
  | { kind: "cron"; expr: string; tz?: string };

export type CronPayload =
  | { kind: "systemEvent"; text: string }
  | { kind: "agentTurn"; message: string; model?: string; thinking?: string; timeoutSeconds?: number; deliver?: boolean; channel?: string; to?: string };

export interface CronJobState {
  lastRunAtMs?: number;
  lastRunStatus?: string;
  nextRunAtMs?: number;
}

export interface CronJob {
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
  state: CronJobState;
}

export interface Session {
  key: string;
  kind?: string;
  channel?: string;
  label?: string;
  displayName?: string;
  model?: string;
  totalTokens?: number;
  updatedAt?: number;
  sessionId?: string;
  lastChannel?: string;
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; text?: string }>;
  timestamp?: string;
}

export interface GatewayStats {
  activeSessions: number;
  totalCronJobs: number;
  uptime: number;
  connected: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
