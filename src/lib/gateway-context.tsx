"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import type {
  GatewayConfig,
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
  send: <T = unknown>(method: string, params?: Record<string, unknown>) => Promise<T>;
  refreshCronJobs: () => void;
  refreshSessions: () => void;
  refreshConfig: () => void;
  refreshStats: () => void;
  disconnect: () => void;
}

const GatewayContext = createContext<GatewayContextType | null>(null);

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const pendingRef = useRef<Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>>(new Map());
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectNonceRef = useRef<string | null>(null);
  const connectSentRef = useRef(false);
  const closedRef = useRef(false);
  const configRef = useRef<GatewayConfig | null>(null);

  // Load config from API on mount
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.gateway?.url && data.gateway?.token) {
          setConfigState(data.gateway);
        }
      })
      .catch((err) => { console.error("[gateway]", err) });
  }, []);

  // Keep configRef in sync
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const sendFrame = useCallback((ws: WebSocket, frame: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(frame));
    }
  }, []);

  const sendConnectRequest = useCallback((ws: WebSocket, cfg: GatewayConfig, nonce?: string | null) => {
    if (connectSentRef.current) return;
    connectSentRef.current = true;
    if (connectTimerRef.current) {
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }

    const id = generateId();
    const params: Record<string, unknown> = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "openclaw-control-ui",
        version: "1.0.0",
        platform: typeof navigator !== "undefined" ? navigator.platform ?? "web" : "web",
        mode: "webchat",
      },
      role: "operator",
      scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
      caps: [],
      auth: {
        token: cfg.token,
      },
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "TheHelm/1.0",
      locale: typeof navigator !== "undefined" ? navigator.language : "en",
    };

    const frame = { type: "req", id, method: "connect", params };

    const p = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          reject(new Error("Connect request timed out"));
        }
      }, 30000);
      pendingRef.current.set(id, { resolve, reject, timer });
    });

    sendFrame(ws, frame);

    p.then((hello) => {
      setStatus("connected");
      setStats((s) => ({ ...s, connected: true }));
    }).catch(() => {
      ws.close(4008, "connect failed");
    });
  }, [sendFrame]);

  const connect = useCallback((cfg: GatewayConfig) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    closedRef.current = false;
    connectSentRef.current = false;
    connectNonceRef.current = null;
    setStatus("connecting");

    // Clean URL - no query params
    const url = cfg.url.endsWith("/") ? cfg.url.slice(0, -1) : cfg.url;

    // Validate WebSocket URL
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        setStatus("error");
        return;
      }
      if (parsed.username || parsed.password) {
        setStatus("error");
        return;
      }
    } catch {
      setStatus("error");
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // Wait for connect.challenge event, or send connect after 750ms timeout
        connectTimerRef.current = setTimeout(() => {
          sendConnectRequest(ws, cfg, null);
        }, 750);
      };

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data) as Record<string, unknown>;

          // Handle events
          if (frame.type === "event") {
            const evt = frame as { event?: string; payload?: unknown };

            // Connect challenge - gateway sends a nonce
            if (evt.event === "connect.challenge") {
              const payload = evt.payload as { nonce?: string } | undefined;
              if (payload?.nonce) {
                connectNonceRef.current = payload.nonce;
                sendConnectRequest(ws, cfg, payload.nonce);
              }
              return;
            }

            // Other events (status updates, etc.)
            return;
          }

          // Handle responses
          if (frame.type === "res") {
            const res = frame as { id?: string; ok?: boolean; payload?: unknown; error?: { message?: string } };
            const id = res.id;
            if (id && pendingRef.current.has(id)) {
              const pending = pendingRef.current.get(id)!;
              clearTimeout(pending.timer);
              pendingRef.current.delete(id);
              if (res.ok) {
                pending.resolve(res.payload);
              } else {
                pending.reject(new Error(res.error?.message ?? "request failed"));
              }
            }
            return;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = (ev) => {
        setStatus("disconnected");
        setStats((s) => ({ ...s, connected: false }));
        wsRef.current = null;
        if (connectTimerRef.current) {
          clearTimeout(connectTimerRef.current);
          connectTimerRef.current = null;
        }
        // Flush pending
        for (const [, p] of pendingRef.current) {
          clearTimeout(p.timer);
          p.reject(new Error(`gateway closed (${ev.code}): ${ev.reason}`));
        }
        pendingRef.current.clear();

        // Auto reconnect after 5s if not intentionally closed
        if (!closedRef.current && configRef.current) {
          if (reconnectRef.current) clearTimeout(reconnectRef.current);
          reconnectRef.current = setTimeout(() => {
            if (configRef.current) connect(configRef.current);
          }, 5000);
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setStats((s) => ({ ...s, connected: false }));
      };
    } catch {
      setStatus("error");
    }
  }, [sendConnectRequest]);

  const disconnect = useCallback(() => {
    closedRef.current = true;
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
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
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    };
  }, [config, connect]);

  const send = useCallback(
    <T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          reject(new Error("Not connected to gateway"));
          return;
        }
        const id = generateId();
        const frame = { type: "req", id, method, params };
        // Timeout after 30s
        const timer = setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error("Request timed out"));
          }
        }, 30000);
        pendingRef.current.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
        wsRef.current.send(JSON.stringify(frame));
      });
    },
    []
  );

  const refreshCronJobs = useCallback(() => {
    send("cron.list", { includeDisabled: true })
      .then((result) => {
        if (Array.isArray(result)) setCronJobs(result);
        else if (result && typeof result === "object" && "jobs" in (result as Record<string, unknown>)) {
          setCronJobs((result as { jobs: CronJob[] }).jobs);
        }
      })
      .catch((err) => { console.error("[gateway]", err) });
  }, [send]);

  const refreshSessions = useCallback(() => {
    send("sessions.list")
      .then((result) => {
        if (Array.isArray(result)) setSessions(result);
        else if (result && typeof result === "object" && "sessions" in (result as Record<string, unknown>)) {
          setSessions((result as { sessions: Session[] }).sessions);
        }
      })
      .catch((err) => { console.error("[gateway]", err) });
  }, [send]);

  const refreshConfig = useCallback(() => {
    send("config.get")
      .then((result) => {
        setRawConfig(JSON.stringify(result, null, 2));
      })
      .catch((err) => { console.error("[gateway]", err) });
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
      .catch((err) => { console.error("[gateway]", err) });
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
      // Persist to file via API
      fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: cfg }),
      }).catch((err) => { console.error("[gateway]", err) });
      setConfigState(cfg);
    },
    []
  );

  const clearConfig = useCallback(() => {
    fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gateway: { url: "", token: "" } }),
    }).catch((err) => { console.error("[gateway]", err) });
    disconnect();
    setConfigState(null);
  }, [disconnect]);

  const contextValue = useMemo(() => ({
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
  }), [config, status, stats, cronJobs, sessions, rawConfig,
       setConfig, clearConfig, send, refreshCronJobs,
       refreshSessions, refreshConfig, refreshStats, disconnect]);

  return (
    <GatewayContext.Provider value={contextValue}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error("useGateway must be used within GatewayProvider");
  return ctx;
}
