"use client";

import { LayoutGrid, Plus, Move, Maximize2 } from "lucide-react";

export function WelcomeWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <LayoutGrid className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Welcome to Your Dashboard</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        This is your customizable homepage. Add widgets to monitor your gateway
        exactly the way you want.
      </p>
      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-1.5">
          <Plus className="w-4 h-4 text-primary" />
          <span>Add widgets</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Move className="w-4 h-4 text-primary" />
          <span>Drag to place</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Maximize2 className="w-4 h-4 text-primary" />
          <span>Resize freely</span>
        </div>
      </div>
    </div>
  );
}
