"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
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
      <div className={cn("inline-flex items-center rounded-md border bg-background p-0.5", className)}>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Theme loading">
          <Sun className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center rounded-md border bg-background p-0.5", className)}
      role="group"
      aria-label="Theme"
    >
      {THEMES.map(({ name, label, icon: Icon }) => {
        const active = theme === name;
        return (
          <Button
            key={name}
            type="button"
            variant={active ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(name)}
            aria-label={label}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
