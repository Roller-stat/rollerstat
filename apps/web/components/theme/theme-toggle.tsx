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
      <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background", className)}>
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
        className={cn(
          "h-10 w-10 min-w-10 justify-center gap-0 rounded-md bg-background px-0 [&>svg:last-child]:hidden",
          className
        )}
        aria-label="Theme"
      >
        <SelectedIcon className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent align="end" className="z-[220] min-w-[3rem]">
        {THEMES.map(({ name, label, icon: Icon }) => (
          <SelectItem key={name} value={name} aria-label={label} title={label}>
            <span className="flex w-full items-center justify-center">
              <Icon className="h-4 w-4" />
              <span className="sr-only">{label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
