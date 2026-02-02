"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemePickerProps {
  collapsed?: boolean;
}

export function ThemePicker({ collapsed }: ThemePickerProps) {
  const { theme, themes, setTheme } = useTheme();
  const currentTheme = themes.find((t) => t.id === theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            collapsed ? "w-full justify-center" : "w-full justify-start gap-2"
          )}
        >
          <Palette className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <span className="text-xs truncate">
              {currentTheme?.name ?? "Theme"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-52">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              theme === t.id && "bg-accent"
            )}
          >
            <div className="flex gap-1">
              {t.preview.map((color, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">
                {t.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
