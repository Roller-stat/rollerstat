"use client";

import { Logo } from "./logo";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { navbarConfig } from "@/lib/navbar-config";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`
        w-full
        flex 
        ${navbarConfig.height.desktop} 
        items-center 
        justify-between
        ${navbarConfig.spacing.container}
      `}>
        {/* Logo - always visible with proper spacing */}
        <div className={navbarConfig.spacing.logoMargin}>
          <Logo size="md" showText={true} />
        </div>
        
        {/* Desktop Navigation - hidden on mobile */}
        <DesktopNav className={`hidden ${navbarConfig.breakpoints.mobile}:flex ${navbarConfig.spacing.navGap}`} />
        
        {/* Mobile Navigation - visible only on mobile/tablet */}
        <div className="md:hidden mr-4 sm:mr-6 lg:mr-8">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}