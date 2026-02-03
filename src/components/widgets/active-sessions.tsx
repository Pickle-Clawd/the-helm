"use client";

import { useGateway } from "@/lib/gateway-context";
import { shortKey } from "@/lib/session-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function ActiveSessionsWidget() {
  const { sessions } = useGateway();

  return (
    <div className="flex flex-col h-full">
      <div className="px-[clamp(0.75rem,2cqw,1rem)] pt-1 pb-[clamp(0.25rem,0.8cqw,0.5rem)]">
        <p className="text-[clamp(0.6rem,1.4cqw,0.75rem)] text-muted-foreground">
          {sessions.length} active
        </p>
      </div>
      <ScrollArea className="flex-1 px-[clamp(0.75rem,2cqw,1rem)] pb-[clamp(0.75rem,2cqw,1rem)]">
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[clamp(0.7rem,1.8cqw,0.875rem)]">
            No active sessions
          </div>
        ) : (
          <div className="space-y-[clamp(0.375rem,1cqw,0.5rem)]">
            {sessions.map((session) => (
              <div
                key={session.key}
                className="flex items-center justify-between p-[clamp(0.375rem,1.2cqw,0.625rem)] rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[clamp(0.7rem,1.8cqw,0.875rem)] truncate">
                    {session.label || shortKey(session.key)}
                  </p>
                  <p className="text-[clamp(0.6rem,1.4cqw,0.75rem)] text-muted-foreground truncate mt-0.5">
                    {session.lastChannel || session.channel || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-[clamp(0.375rem,1cqw,0.75rem)]">
                  {session.model && (
                    <Badge variant="outline" className="font-mono text-[clamp(0.55rem,1.2cqw,0.75rem)]">
                      {session.model}
                    </Badge>
                  )}
                  {session.totalTokens !== undefined && (
                    <p className="text-[clamp(0.55rem,1.2cqw,0.75rem)] text-muted-foreground mt-1">
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
