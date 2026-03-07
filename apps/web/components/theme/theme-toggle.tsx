"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ThemeName = "light" | "dark" | "system";

const THEMES: Array<{ name: ThemeName; label: string; icon: typeof Sun }> = [
  { name: "light", label: "Light", icon: Sun },
  { name: "dark", label: "Dark", icon: Moon },
  { name: "system", label: "System", icon: Monitor },
];

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("inline-flex h-10 items-center rounded-md border bg-background px-3", className)}>
        <Sun className="h-4 w-4" />
      </div>
    );
  }

  const selectedTheme: ThemeName = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  const selectedThemeMeta = THEMES.find((item) => item.name === selectedTheme) ?? THEMES[2];
  const SelectedIcon = selectedThemeMeta.icon;

  return (
    <Select value={selectedTheme} onValueChange={(value: ThemeName) => setTheme(value)}>
      <SelectTrigger
        className={cn("h-10 rounded-md bg-background px-3 uppercase", className)}
        aria-label="Theme"
      >
        <span className="flex items-center gap-2">
          <SelectedIcon className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide">{selectedThemeMeta.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {THEMES.map(({ name, label, icon: Icon }) => (
          <SelectItem key={name} value={name}>
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
