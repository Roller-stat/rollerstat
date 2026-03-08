"use client";

import { Logo } from "./logo";
import { UnifiedNav } from "./unified-nav";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-[100] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-24 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo - always visible with proper spacing */}
        <div className="ml-4 sm:ml-6 lg:ml-8">
          <Logo size="lg" mobileSize="ml" showText={true} loop={true} loopDelay={2000} />
        </div>
        
        {/* Unified Navigation - handles both desktop and mobile */}
        <UnifiedNav />
      </div>
    </nav>
  );
}