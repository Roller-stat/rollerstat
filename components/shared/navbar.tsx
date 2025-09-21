"use client";

import { Logo } from "./logo";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { navbarConfig } from "@/lib/navbar-config";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background">
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
          <Logo size="lg" showText={true} className="h-48 w-48"/>
        </div>
        
        {/* Desktop Navigation - hidden only on very small screens */}
        <DesktopNav className={`hidden sm:flex ${navbarConfig.spacing.navGap}`} />
        
        {/* Mobile Navigation - visible only on very small screens */}
        <div className="sm:hidden mr-4">
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}