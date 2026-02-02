"use client";

import { useGateway } from "@/lib/gateway-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function shortKey(key: string): string {
  const parts = key.split(":");
  if (parts.length <= 2) return key;
  return parts.slice(2).join(":");
}

export function ActiveSessionsWidget() {
  const { sessions } = useGateway();

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2">
        <p className="text-xs text-muted-foreground">
          {sessions.length} active
        </p>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No active sessions
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {session.label || shortKey(session.key)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {session.lastChannel || session.channel || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {session.model && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {session.model}
                    </Badge>
                  )}
                  {session.totalTokens !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.totalTokens.toLocaleString()} tokens
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
