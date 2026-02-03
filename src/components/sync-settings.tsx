"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  downloadLayout,
  importLayout,
  saveLayoutToFile,
  resetConfigFile,
} from "@/lib/layout-sync";
import { type WidgetLayoutItem } from "@/lib/widget-registry";
import {
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface SyncSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WidgetLayoutItem[];
  onLayoutRestored: (items: WidgetLayoutItem[]) => void;
  onReset: () => void;
}

export function SyncSettings({
  open,
  onOpenChange,
  items,
  onLayoutRestored,
  onReset,
}: SyncSettingsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleReset = useCallback(async () => {
    // Reset layout only, preserve gateway settings
    await saveLayoutToFile([]);
    onReset();
    onOpenChange(false);
  }, [onReset, onOpenChange]);

  const handleExport = useCallback(() => {
    if (items.length === 0) {
      setStatus("No layout to export");
      return;
    }
    downloadLayout(items);
    setStatus("Layout downloaded!");
  }, [items]);

  const handleImport = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const layout = importLayout(text);
        if (layout) {
          const restored = layout as WidgetLayoutItem[];
          saveLayoutToFile(restored);
          onLayoutRestored(restored);
          setStatus(`Imported ${restored.length} widgets!`);
        } else {
          setStatus("Invalid layout file");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onLayoutRestored]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Layout Settings</DialogTitle>
          <DialogDescription>
            Export or import your dashboard layout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Export / Import</h3>
            <p className="text-xs text-muted-foreground">
              Download your layout as a JSON file, or import one.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
                disabled={items.length === 0}
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4" />
                Import JSON
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              aria-label="Import layout file"
              onChange={handleFileChange}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Reset */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Reset Dashboard</h3>
            <p className="text-xs text-muted-foreground">
              Delete all saved settings and restore the default layout.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>
          </div>

          {status && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {status}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
