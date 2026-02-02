"use client";

import { useState } from "react";
import { useGateway } from "@/lib/gateway-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Send, MessageSquare, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Session, SessionMessage } from "@/lib/gateway-types";

function formatTime(ts?: string): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return ts; }
}

export default function SessionsPage() {
  const { sessions, send, refreshSessions } = useGateway();
  const [selected, setSelected] = useState<Session | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const openSession = async (session: Session) => {
    setSelected(session);
    setSheetOpen(true);
    setMessages(session.messages || []);
    try {
      const result = await send("session.messages", { key: session.key });
      if (Array.isArray(result)) {
        setMessages(result as SessionMessage[]);
      } else if (result && typeof result === "object" && "messages" in (result as Record<string, unknown>)) {
        setMessages((result as { messages: SessionMessage[] }).messages);
      }
    } catch {
      // Use existing messages
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selected) return;
    setLoading(true);
    try {
      await send("session.send", { key: selected.key, message: messageInput.trim() });
      setMessages((prev) => [
        ...prev,
        { role: "user", content: messageInput.trim(), timestamp: new Date().toISOString() },
      ]);
      setMessageInput("");
      toast.success("Message sent");
      refreshSessions();
    } catch (e) {
      toast.error(`Failed to send: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-1">Active conversations and message history</p>
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
                <TableHead>Session Key</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No active sessions
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow
                    key={session.key}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openSession(session)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        {session.key}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.model ? (
                        <Badge variant="outline" className="font-mono text-xs">{session.model}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.tokens?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {session.lastMessage || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTime(session.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Session Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:w-[640px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {selected?.key}
            </SheetTitle>
            <SheetDescription>
              {selected?.model && <Badge variant="outline" className="mr-2 font-mono text-xs">{selected.model}</Badge>}
              {selected?.tokens !== undefined && `${selected.tokens.toLocaleString()} tokens`}
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          {/* Messages */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No messages in this session</p>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user" ? "bg-gradient-to-br from-gradient-orange to-gradient-pink" : "bg-muted"
                    )}>
                      {msg.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-4 py-2.5",
                      msg.role === "user"
                        ? "bg-gradient-to-r from-gradient-orange/20 to-gradient-pink/20 text-foreground"
                        : "bg-muted/80 text-foreground"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.timestamp)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Send Message */}
          <div className="flex gap-2 pt-4 border-t border-border/50">
            <Input
              placeholder="Send a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={loading || !messageInput.trim()}
              className="bg-gradient-to-r from-gradient-orange to-gradient-pink text-white hover:opacity-90 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
