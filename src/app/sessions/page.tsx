"use client";

import { useState } from "react";
import { useGateway } from "@/lib/gateway-context";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@/lib/gateway-types";

function formatMs(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function shortKey(key: string): string {
  // e.g. "agent:main:main" -> "main"
  // "agent:main:cron:abc-123" -> "cron:abc-12..."
  const parts = key.split(":");
  if (parts.length <= 2) return key;
  const suffix = parts.slice(2).join(":");
  return suffix.length > 30 ? suffix.slice(0, 30) + "…" : suffix;
}

export default function SessionsPage() {
  const { sessions, send, refreshSessions } = useGateway();
  const [selected, setSelected] = useState<Session | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [details, setDetails] = useState<string>("Loading...");

  const openSession = async (session: Session) => {
    setSelected(session);
    setSheetOpen(true);
    setDetails(JSON.stringify(session, null, 2));
  };

  const killSession = async (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Kill session "${session.label || session.key}"?`)) return;
    try {
      await send("sessions.delete", { sessionKey: session.key });
      toast.success(`Killed ${session.label || session.key}`);
      refreshSessions();
    } catch (err) {
      toast.error(`Failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">Active conversations and agents</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshSessions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No active sessions
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow
                    key={session.key}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => openSession(session)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span title={session.key}>{session.label || shortKey(session.key)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.lastChannel || session.channel ? (
                        <Badge variant="secondary" className="text-xs">
                          {session.lastChannel || session.channel}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {session.model ? (
                        <Badge variant="outline" className="font-mono text-xs">{session.model}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.totalTokens?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatMs(session.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[640px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selected?.label || selected?.key}
            </SheetTitle>
            <SheetDescription>
              {selected?.model && <Badge variant="outline" className="mr-2 font-mono text-xs">{selected.model}</Badge>}
              {selected?.totalTokens !== undefined && `${selected.totalTokens.toLocaleString()} tokens`}
            </SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          <ScrollArea className="flex-1">
            <pre className="text-xs font-mono whitespace-pre-wrap break-all text-muted-foreground">
              {details}
            </pre>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
