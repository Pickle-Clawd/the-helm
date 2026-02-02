"use client";

import { getWidget } from "@/lib/widget-registry";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  instanceId: string;
  widgetId: string;
  editMode: boolean;
  onRemove: () => void;
}

export function WidgetWrapper({
  instanceId,
  widgetId,
  editMode,
  onRemove,
}: WidgetWrapperProps) {
  const def = getWidget(widgetId);

  if (!def) {
    return (
      <div className="h-full rounded-xl border border-destructive/50 bg-destructive/10 flex items-center justify-center text-sm text-destructive">
        Unknown widget: {widgetId}
      </div>
    );
  }

  const Component = def.component;

  return (
    <div
      className={cn(
        "h-full rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden flex flex-col",
        editMode && "ring-1 ring-primary/20 shadow-lg"
      )}
    >
      {/* Widget header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b border-border/30 shrink-0",
          editMode ? "widget-drag-handle cursor-grab active:cursor-grabbing" : ""
        )}
      >
        {editMode && (
          <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />
        )}
        <def.icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium truncate flex-1">{def.name}</span>
        {editMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Widget content */}
      <div className="flex-1 overflow-hidden">
        <Component instanceId={instanceId} editMode={editMode} />
      </div>
    </div>
  );
}
