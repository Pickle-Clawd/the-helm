import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Widget type definitions                                            */
/* ------------------------------------------------------------------ */

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "monitoring" | "data" | "utility" | "custom";
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize;
  component: ComponentType<WidgetComponentProps>;
}

export interface WidgetComponentProps {
  /** Unique instance ID for this placed widget */
  instanceId: string;
  /** Whether edit mode is active */
  editMode: boolean;
}

/** Saved layout item */
export interface WidgetLayoutItem {
  /** Unique instance ID (e.g. "cron-summary-abc123") */
  i: string;
  /** Widget definition ID (e.g. "cron-summary") */
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** JSON-based widget definition (future plugin format) */
export interface JsonWidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  /** Data source configuration */
  dataSource: {
    type: "gateway-stats" | "cron-jobs" | "sessions" | "custom-api";
    fields?: string[];
    endpoint?: string;
  };
  /** Display template */
  display: {
    type: "key-value" | "list" | "chart" | "number";
    config: Record<string, unknown>;
  };
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return getAllWidgets().filter((w) => w.category === category);
}

export function getCategories(): string[] {
  const cats = new Set(getAllWidgets().map((w) => w.category));
  return Array.from(cats);
}

/* ------------------------------------------------------------------ */
/*  Layout persistence                                                 */
/* ------------------------------------------------------------------ */

const LAYOUT_STORAGE_KEY = "the-helm-layout";
const EDIT_MODE_KEY = "the-helm-edit-mode";

export function saveLayout(items: WidgetLayoutItem[]) {
  localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(items));
}

export function loadLayout(): WidgetLayoutItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLayout() {
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
}

export function saveEditMode(mode: boolean) {
  localStorage.setItem(EDIT_MODE_KEY, JSON.stringify(mode));
}

export function loadEditMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(EDIT_MODE_KEY);
    if (!raw) return false;
    return JSON.parse(raw);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function generateInstanceId(widgetId: string): string {
  return `${widgetId}-${Math.random().toString(36).slice(2, 8)}`;
}
