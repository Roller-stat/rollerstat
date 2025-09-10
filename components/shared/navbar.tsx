"use client";

import { NavbarLogo } from "./navbar-logo";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo - always visible */}
        <NavbarLogo />
        
        {/* Desktop Navigation - hidden on mobile */}
        <DesktopNav className="hidden md:flex" />
        
        {/* Mobile Navigation - visible only on mobile/tablet */}
        <MobileNav />
      </div>
    </nav>
  );
}