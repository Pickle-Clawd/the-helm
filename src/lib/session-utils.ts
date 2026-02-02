/**
 * Session-specific utilities for parsing session keys and display.
 */

export type SessionKind = "main" | "cron" | "subagent" | "heartbeat" | "unknown";

/** Parse session kind from session key */
export function parseSessionKind(key: string): SessionKind {
  if (!key) return "unknown";
  // agent:main:main → main
  // agent:main:cron:UUID → cron
  // agent:main:subagent:UUID → subagent
  // agent:main:heartbeat or similar → heartbeat
  const parts = key.split(":");
  if (parts.includes("heartbeat")) return "heartbeat";
  if (parts.includes("subagent")) return "subagent";
  if (parts.includes("cron")) return "cron";
  // agent:main:main or agent:main:main.XXXX
  if (parts.length >= 3 && parts[2]?.startsWith("main")) return "main";
  return "unknown";
}

/** Get badge color classes for session kind */
export function getKindBadgeClass(kind: SessionKind): string {
  switch (kind) {
    case "main": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    case "cron": return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    case "subagent": return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    case "heartbeat": return "bg-pink-500/15 text-pink-400 border-pink-500/25";
    default: return "bg-muted text-muted-foreground";
  }
}

/** Check if session is the main session */
export function isMainSession(key: string): boolean {
  return parseSessionKind(key) === "main";
}

/** Short display name for a session key */
export function shortKey(key: string): string {
  const parts = key.split(":");
  if (parts.length <= 2) return key;
  const suffix = parts.slice(2).join(":");
  return suffix.length > 30 ? suffix.slice(0, 30) + "…" : suffix;
}

/** Extract text from message content (handles string or array) */
export function extractMessageText(content: string | Array<{ type: string; text?: string; thinking?: string }>): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content);
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("\n");
}
