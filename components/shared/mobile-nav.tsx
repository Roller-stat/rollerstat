"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navigationItems, navigationConfig } from "@/lib/navigation";
import { Logo } from "./logo";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "md:hidden h-9 w-9",
            className
          )}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={cn(navigationConfig.mobile.drawerWidth.default, navigationConfig.mobile.drawerWidth.sm)}>
        <SheetHeader>
          <SheetTitle>
            <Logo size="md" showText={true} href="/" />
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-8">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
