"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type {
  GatewayConfig,
  GatewayMessage,
  ConnectionStatus,
  GatewayStats,
  CronJob,
  Session,
} from "./gateway-types";

interface GatewayContextType {
  config: GatewayConfig | null;
  status: ConnectionStatus;
  stats: GatewayStats;
  cronJobs: CronJob[];
  sessions: Session[];
  rawConfig: string;
  setConfig: (config: GatewayConfig) => void;
  clearConfig: () => void;
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  refreshCronJobs: () => void;
  refreshSessions: () => void;
  refreshConfig: () => void;
  refreshStats: () => void;
  disconnect: () => void;
}

const GatewayContext = createContext<GatewayContextType | null>(null);

const STORAGE_KEY = "clawpilot-gateway-config";

function loadConfig(): GatewayConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveConfig(config: GatewayConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function clearStoredConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function GatewayProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<GatewayConfig | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [stats, setStats] = useState<GatewayStats>({
    activeSessions: 0,
    totalCronJobs: 0,
    uptime: 0,
    connected: false,
  });
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rawConfig, setRawConfig] = useState<string>("{}");

  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const pendingRef = useRef<Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>>(new Map());
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const stored = loadConfig();
    if (stored) setConfigState(stored);
  }, []);

  const connect = useCallback((cfg: GatewayConfig) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus("connecting");

    // Build ws URL with token
    const url = cfg.url.endsWith("/") ? cfg.url.slice(0, -1) : cfg.url;
    const wsUrl = `${url}?token=${encodeURIComponent(cfg.token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        setStats((s) => ({ ...s, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: GatewayMessage = JSON.parse(event.data);
          if (msg.id !== undefined) {
            const pending = pendingRef.current.get(msg.id as number);
            if (pending) {
              pendingRef.current.delete(msg.id as number);
              if (msg.error) {
                pending.reject(new Error(msg.error.message));
              } else {
                pending.resolve(msg.result);
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        setStats((s) => ({ ...s, connected: false }));
        wsRef.current = null;
        // Auto reconnect after 5s
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(() => {
          const stored = loadConfig();
          if (stored) connect(stored);
        }, 5000);
      };

      ws.onerror = () => {
        setStatus("error");
        setStats((s) => ({ ...s, connected: false }));
      };
    } catch {
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  // Connect when config changes
  useEffect(() => {
    if (config) {
      connect(config);
    }
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [config, connect]);

  const send = useCallback(
    (method: string, params?: Record<string, unknown>): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error("Not connected to gateway"));
          return;
        }
        const id = ++idRef.current;
        pendingRef.current.set(id, { resolve, reject });
        const msg: GatewayMessage = { jsonrpc: "2.0", id, method, params };
        wsRef.current.send(JSON.stringify(msg));
        // Timeout after 30s
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error("Request timed out"));
          }
        }, 30000);
      });
    },
    []
  );

  const refreshCronJobs = useCallback(() => {
    send("cron.list")
      .then((result) => {
        if (Array.isArray(result)) setCronJobs(result);
        else if (result && typeof result === "object" && "jobs" in (result as Record<string, unknown>)) {
          setCronJobs((result as { jobs: CronJob[] }).jobs);
        }
      })
      .catch(() => {});
  }, [send]);

  const refreshSessions = useCallback(() => {
    send("session.list")
      .then((result) => {
        if (Array.isArray(result)) setSessions(result);
        else if (result && typeof result === "object" && "sessions" in (result as Record<string, unknown>)) {
          setSessions((result as { sessions: Session[] }).sessions);
        }
      })
      .catch(() => {});
  }, [send]);

  const refreshConfig = useCallback(() => {
    send("config.get")
      .then((result) => {
        setRawConfig(JSON.stringify(result, null, 2));
      })
      .catch(() => {});
  }, [send]);

  const refreshStats = useCallback(() => {
    send("status")
      .then((result) => {
        if (result && typeof result === "object") {
          const r = result as Record<string, unknown>;
          setStats((s) => ({
            ...s,
            activeSessions: (r.activeSessions as number) ?? s.activeSessions,
            totalCronJobs: (r.totalCronJobs as number) ?? s.totalCronJobs,
            uptime: (r.uptime as number) ?? s.uptime,
            connected: true,
          }));
        }
      })
      .catch(() => {});
  }, [send]);

  // Auto-refresh data when connected
  useEffect(() => {
    if (status === "connected") {
      refreshStats();
      refreshCronJobs();
      refreshSessions();
      refreshConfig();
      const interval = setInterval(() => {
        refreshStats();
        refreshCronJobs();
        refreshSessions();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [status, refreshStats, refreshCronJobs, refreshSessions, refreshConfig]);

  const setConfig = useCallback(
    (cfg: GatewayConfig) => {
      saveConfig(cfg);
      setConfigState(cfg);
    },
    []
  );

  const clearConfig = useCallback(() => {
    clearStoredConfig();
    disconnect();
    setConfigState(null);
  }, [disconnect]);

  return (
    <GatewayContext.Provider
      value={{
        config,
        status,
        stats,
        cronJobs,
        sessions,
        rawConfig,
        setConfig,
        clearConfig,
        send,
        refreshCronJobs,
        refreshSessions,
        refreshConfig,
        refreshStats,
        disconnect,
      }}
    >
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error("useGateway must be used within GatewayProvider");
  return ctx;
}
