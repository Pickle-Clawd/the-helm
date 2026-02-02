export interface GatewayConfig {
  url: string;
  token: string;
}

export interface GatewayMessage {
  jsonrpc?: string;
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface CronJob {
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  command?: string;
  config?: Record<string, unknown>;
  history?: CronRunEntry[];
}

export interface CronRunEntry {
  timestamp: string;
  status: 'success' | 'error' | 'running';
  duration?: number;
  error?: string;
}

export interface Session {
  key: string;
  model?: string;
  tokens?: number;
  lastMessage?: string;
  updatedAt?: string;
  messages?: SessionMessage[];
}

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface GatewayStats {
  activeSessions: number;
  totalCronJobs: number;
  uptime: number;
  connected: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
