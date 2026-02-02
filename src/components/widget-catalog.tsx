"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllWidgets, getCategories } from "@/lib/widget-registry";
import { Plus } from "lucide-react";

interface WidgetCatalogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widgetId: string) => void;
}

const categoryLabels: Record<string, string> = {
  monitoring: "📊 Monitoring",
  data: "📋 Data",
  utility: "🔧 Utility",
  custom: "🧩 Custom",
};

export function WidgetCatalog({ open, onOpenChange, onAdd }: WidgetCatalogProps) {
  const categories = getCategories();
  const allWidgets = getAllWidgets();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget to add to your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map((category) => {
            const widgets = allWidgets.filter((w) => w.category === category);
            if (widgets.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {categoryLabels[category] ?? category}
                </h3>
                <div className="space-y-2">
                  {widgets.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => {
                        onAdd(widget.id);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/50 hover:border-primary/30 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <widget.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{widget.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {widget.description}
                        </p>
                      </div>
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Plus className="w-3 h-3" />
                          Add
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
