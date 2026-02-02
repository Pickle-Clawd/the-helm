"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useGateway } from "@/lib/gateway-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, MessageSquare, Trash2, Send, Star, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatTimestamp, formatTimeAgo } from "@/lib/cron-utils";
import { getModelBadgeClass, shortModel, estimateCost, formatCost } from "@/lib/model-utils";
import {
  parseSessionKind, getKindBadgeClass, isMainSession, shortKey, extractMessageText,
  type SessionKind,
} from "@/lib/session-utils";
import type { Session, SessionMessage } from "@/lib/gateway-types";

type KindFilter = "all" | "main" | "cron" | "subagent" | "heartbeat";

export default function SessionsPage() {
  const { sessions, send, refreshSessions } = useGateway();
  const [selected, setSelected] = useState<Session | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  // Detail panel state
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);

  // Tick for relative time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // Sort & filter sessions
  const sortedSessions = useMemo(() => {
    let list = [...sessions];

    // Filter by kind
    if (kindFilter !== "all") {
      list = list.filter((s) => parseSessionKind(s.key) === kindFilter);
    }

    // Sort: main sessions first, then by updatedAt descending
    list.sort((a, b) => {
      const aMain = isMainSession(a.key) ? 1 : 0;
      const bMain = isMainSession(b.key) ? 1 : 0;
      if (aMain !== bMain) return bMain - aMain;
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });

    return list;
  }, [sessions, kindFilter]);

  const sessionCount = sortedSessions.length;

  const fetchHistory = useCallback(async (sessionKey: string) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const result = await send("chat.history", { sessionKey, limit: 5 }) as { messages?: SessionMessage[] };
      setMessages(result?.messages ?? []);
    } catch {
      // silently fail — some sessions may not have history
    } finally {
      setLoadingMessages(false);
    }
  }, [send]);

  const openSession = (session: Session) => {
    setSelected(session);
    setSheetOpen(true);
    setMessageInput("");
    fetchHistory(session.key);
  };

  const killSession = async (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Kill session "${session.label || session.key}"?`)) return;
    try {
      await send("sessions.delete", { key: session.key });
      toast.success(`Killed ${session.label || session.key}`);
      refreshSessions();
      if (selected?.key === session.key) setSheetOpen(false);
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  const sendMessage = async () => {
    if (!selected || !messageInput.trim()) return;
    setSending(true);
    try {
      await send("chat.send", { sessionKey: selected.key, message: messageInput.trim() });
      toast.success("Message sent");
      setMessageInput("");
      // Refresh history after a short delay
      setTimeout(() => fetchHistory(selected.key), 1000);
    } catch (err) {
      toast.error(`Failed to send: ${(err as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Active conversations and agents
              {sessionCount > 0 && (
                <span className="ml-2 text-xs">
                  ({sessionCount} active session{sessionCount !== 1 ? "s" : ""})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={kindFilter} onValueChange={(v) => setKindFilter(v as KindFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Kinds</SelectItem>
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="cron">Cron</SelectItem>
                <SelectItem value="subagent">Subagent</SelectItem>
                <SelectItem value="heartbeat">Heartbeat</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={refreshSessions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      {sessions.length === 0
                        ? "No active sessions"
                        : "No sessions match this filter"}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSessions.map((session) => {
                    const kind = parseSessionKind(session.key);
                    const main = isMainSession(session.key);
                    const cost = estimateCost(session.totalTokens, session.model);
                    const contextPct = session.totalTokens && session.contextTokens
                      ? Math.min(100, Math.round((session.totalTokens / session.contextTokens) * 100))
                      : null;

                    return (
                      <TableRow
                        key={session.key}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors group ${
                          main ? "border-l-2 border-l-emerald-500/50 bg-emerald-500/[0.03]" : ""
                        }`}
                        onClick={() => openSession(session)}
                      >
                        {/* Session name */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {main ? (
                              <Star className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate max-w-[200px]">
                                  {session.label || shortKey(session.key)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{session.key}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>

                        {/* Kind badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 font-normal ${getKindBadgeClass(kind)}`}
                          >
                            {kind}
                          </Badge>
                        </TableCell>

                        {/* Channel */}
                        <TableCell>
                          {session.lastChannel || session.channel ? (
                            <Badge variant="secondary" className="text-xs">
                              {session.lastChannel || session.channel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Model badge */}
                        <TableCell>
                          {session.model ? (
                            <Badge
                              variant="outline"
                              className={`font-mono text-xs ${getModelBadgeClass(session.model)}`}
                            >
                              {shortModel(session.model)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Tokens + cost */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-sm text-muted-foreground">
                              {session.totalTokens?.toLocaleString() ?? "—"}
                            </div>
                            {cost !== null && (
                              <div className="text-[11px] text-muted-foreground/60">
                                {formatCost(cost)}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Context usage bar */}
                        <TableCell>
                          {contextPct !== null ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1 min-w-[80px]">
                                  <Progress
                                    value={contextPct}
                                    className="h-1.5"
                                  />
                                  <div className="text-[10px] text-muted-foreground/60">
                                    {contextPct}%
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{session.totalTokens?.toLocaleString()} / {session.contextTokens?.toLocaleString()} tokens</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Updated: absolute + relative */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="text-sm text-muted-foreground">
                              {formatTimestamp(session.updatedAt)}
                            </div>
                            {session.updatedAt && (
                              <div className="text-[11px] text-muted-foreground/60">
                                {formatTimeAgo(session.updatedAt)}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Kill button */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => killSession(session, e)}
                            title="Kill session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[500px] sm:w-[640px] flex flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {selected && isMainSession(selected.key) && (
                  <Star className="w-5 h-5 text-emerald-400" />
                )}
                <MessageSquare className="w-5 h-5" />
                <span className="truncate">
                  {selected?.label || (selected ? shortKey(selected.key) : "")}
                </span>
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  {selected && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getKindBadgeClass(parseSessionKind(selected.key))}`}
                    >
                      {parseSessionKind(selected.key)}
                    </Badge>
                  )}
                  {selected?.model && (
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${getModelBadgeClass(selected.model)}`}
                    >
                      {shortModel(selected.model)}
                    </Badge>
                  )}
                  {selected?.lastChannel && (
                    <Badge variant="secondary" className="text-xs">
                      {selected.lastChannel}
                    </Badge>
                  )}
                  {selected?.totalTokens !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {selected.totalTokens.toLocaleString()} tokens
                      {(() => {
                        const c = estimateCost(selected.totalTokens, selected.model);
                        return c !== null ? ` · ${formatCost(c)}` : "";
                      })()}
                    </span>
                  )}
                </div>
              </SheetDescription>
            </SheetHeader>

            {/* Context usage in detail */}
            {selected?.totalTokens && selected?.contextTokens ? (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Context usage</span>
                  <span>
                    {selected.totalTokens.toLocaleString()} / {selected.contextTokens.toLocaleString()}
                    {" "}({Math.min(100, Math.round((selected.totalTokens / selected.contextTokens) * 100))}%)
                  </span>
                </div>
                <Progress
                  value={Math.min(100, Math.round((selected.totalTokens / selected.contextTokens) * 100))}
                  className="h-2"
                />
              </div>
            ) : null}

            <Separator className="my-4" />

            {/* Message history */}
            <div className="text-xs font-medium text-muted-foreground mb-2">Recent Messages</div>
            <ScrollArea className="flex-1 min-h-0">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No message history available
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary/10 border border-primary/20 ml-6"
                          : msg.role === "assistant"
                            ? "bg-muted/50 border border-border/50 mr-6"
                            : "bg-amber-500/10 border border-amber-500/20 text-xs italic"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1 py-0 ${
                            msg.role === "user"
                              ? "text-primary border-primary/30"
                              : msg.role === "assistant"
                                ? "text-muted-foreground"
                                : "text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {msg.role}
                        </Badge>
                        {msg.timestamp && (
                          <span className="text-[10px] text-muted-foreground/50">
                            {formatTimeAgo(msg.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {extractMessageText(msg.content).slice(0, 500)}
                        {extractMessageText(msg.content).length > 500 ? "…" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Send message */}
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Send Message</div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message... (Ctrl+Enter to send)"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] max-h-[120px] text-sm resize-none"
                  disabled={sending}
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!messageInput.trim() || sending}
                  className="self-end"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
