import type { CronSchedule, CronPayload } from "./gateway-types";

/**
 * Parse a cron expression into human-readable English.
 * Handles common patterns; falls back to raw expression for complex ones.
 */
export function cronExprToHuman(expr: string, tz?: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return expr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const tzSuffix = tz ? ` ${tz}` : "";

  // Every minute
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  // Every N minutes: */N * * * *
  const everyNMin = minute.match(/^\*\/(\d+)$/);
  if (everyNMin && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const n = parseInt(everyNMin[1]);
    return n === 1 ? "Every minute" : `Every ${n} minutes`;
  }

  // Every hour at :MM
  if (/^\d+$/.test(minute) && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every hour at :${minute.padStart(2, "0")}`;
  }

  // Every N hours
  const everyNHour = hour.match(/^\*\/(\d+)$/);
  if (/^\d+$/.test(minute) && everyNHour && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    const n = parseInt(everyNHour[1]);
    return `Every ${n} hour${n > 1 ? "s" : ""} at :${minute.padStart(2, "0")}`;
  }

  // Daily at specific time
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every day at ${formatTime(parseInt(hour), parseInt(minute))}${tzSuffix}`;
  }

  // Every Nth day at specific time: 0 8 */3 * * or 0 8 3-30/3 * *
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && month === "*" && dayOfWeek === "*") {
    const stepMatch = dayOfMonth.match(/^(?:\*|(\d+)-(\d+))\/(\d+)$/);
    if (stepMatch) {
      const n = parseInt(stepMatch[3]);
      return `Every ${n} days at ${formatTime(parseInt(hour), parseInt(minute))}${tzSuffix}`;
    }
  }

  // Specific day of month: 0 8 15 * *
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && /^\d+$/.test(dayOfMonth) && month === "*" && dayOfWeek === "*") {
    const d = parseInt(dayOfMonth);
    return `Monthly on the ${ordinal(d)} at ${formatTime(parseInt(hour), parseInt(minute))}${tzSuffix}`;
  }

  // Weekly on specific day(s)
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dayOfMonth === "*" && month === "*" && dayOfWeek !== "*") {
    const days = parseDaysOfWeek(dayOfWeek);
    if (days) {
      return `${days} at ${formatTime(parseInt(hour), parseInt(minute))}${tzSuffix}`;
    }
  }

  // Every Nth day of month with step + specific day of week (complex)
  // Fall back to raw
  return expr + (tz ? ` (${tz})` : "");
}

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDaysOfWeek(dow: string): string | null {
  // Handle ranges like 1-5, lists like 1,3,5, single values
  const parts = dow.split(",");
  const dayNums: number[] = [];
  for (const part of parts) {
    const range = part.match(/^(\d)-(\d)$/);
    if (range) {
      const start = parseInt(range[1]);
      const end = parseInt(range[2]);
      for (let i = start; i <= end; i++) dayNums.push(i);
    } else if (/^\d$/.test(part)) {
      dayNums.push(parseInt(part));
    } else {
      return null;
    }
  }
  if (dayNums.length === 0) return null;
  if (dayNums.length === 7) return "Every day";
  if (dayNums.length === 5 && [1, 2, 3, 4, 5].every((d) => dayNums.includes(d))) return "Weekdays";
  if (dayNums.length === 2 && dayNums.includes(0) && dayNums.includes(6)) return "Weekends";
  return dayNums.map((d) => DAY_SHORT[d] || `Day ${d}`).join(", ");
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a CronSchedule into human-readable text
 */
export function formatScheduleHuman(schedule: CronSchedule): string {
  if (!schedule || typeof schedule !== "object") return String(schedule ?? "—");
  switch (schedule.kind) {
    case "cron":
      return cronExprToHuman(schedule.expr, schedule.tz);
    case "every": {
      const ms = schedule.everyMs;
      if (ms < 60_000) return `Every ${Math.round(ms / 1000)}s`;
      if (ms < 3_600_000) return `Every ${Math.round(ms / 60_000)}m`;
      if (ms < 86_400_000) {
        const h = Math.floor(ms / 3_600_000);
        const m = Math.round((ms % 3_600_000) / 60_000);
        return m > 0 ? `Every ${h}h ${m}m` : `Every ${h}h`;
      }
      const d = Math.round(ms / 86_400_000);
      return `Every ${d} day${d > 1 ? "s" : ""}`;
    }
    case "at":
      return `Once at ${new Date(schedule.atMs).toLocaleString()}`;
    default:
      return JSON.stringify(schedule);
  }
}

/**
 * Format a CronSchedule as raw/technical representation
 */
export function formatScheduleRaw(schedule: CronSchedule): string {
  if (!schedule || typeof schedule !== "object") return String(schedule ?? "—");
  switch (schedule.kind) {
    case "cron":
      return schedule.expr + (schedule.tz ? ` (${schedule.tz})` : "");
    case "every":
      return `every ${formatMsToInterval(schedule.everyMs)}`;
    case "at":
      return `at ${new Date(schedule.atMs).toLocaleString()}`;
    default:
      return JSON.stringify(schedule);
  }
}

/**
 * Get a short payload preview string
 */
export function getPayloadPreview(payload: CronPayload): string {
  if (!payload || typeof payload !== "object") return "—";
  switch (payload.kind) {
    case "systemEvent":
      return payload.text?.split("\n")[0]?.slice(0, 100) || "—";
    case "agentTurn":
      return payload.message?.split("\n")[0]?.slice(0, 100) || "—";
    default:
      return JSON.stringify(payload).slice(0, 100);
  }
}

/**
 * Format a relative countdown string
 */
export function formatCountdown(targetMs: number): string {
  const now = Date.now();
  const diff = targetMs - now;
  if (diff <= 0) return "now";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const h = hours % 24;
    return h > 0 ? `in ${days}d ${h}h` : `in ${days}d`;
  }
  if (hours > 0) {
    const m = minutes % 60;
    return m > 0 ? `in ${hours}h ${m}m` : `in ${hours}h`;
  }
  if (minutes > 0) {
    return `in ${minutes}m`;
  }
  return `in ${seconds}s`;
}

/**
 * Format relative time ago (e.g. "2h ago", "3d ago")
 */
export function formatTimeAgo(ms?: number): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "";
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

/**
 * Format absolute timestamp
 */
export function formatTimestamp(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * Parse interval ms from a human input like "30m", "2h", "1d"
 */
export function parseIntervalToMs(input: string): number | null {
  const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*(s|sec|m|min|h|hr|hour|d|day)s?$/i);
  if (!match) {
    const num = parseInt(input);
    if (!isNaN(num) && num > 0) return num * 60_000; // assume minutes
    return null;
  }
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
    case "sec":
      return val * 1000;
    case "m":
    case "min":
      return val * 60_000;
    case "h":
    case "hr":
    case "hour":
      return val * 3_600_000;
    case "d":
    case "day":
      return val * 86_400_000;
    default:
      return null;
  }
}

/**
 * Format ms to human interval string
 */
export function formatMsToInterval(ms: number): string {
  if (ms >= 86_400_000 && ms % 86_400_000 === 0) return `${ms / 86_400_000}d`;
  if (ms >= 3_600_000 && ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  if (ms >= 60_000 && ms % 60_000 === 0) return `${ms / 60_000}m`;
  return `${ms / 1000}s`;
}
