"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getNavigationItems } from "@/lib/navigation";
import { useUIStore } from "@/lib/stores";
import { useHydration } from "@/lib/hooks";
import { useTranslations, useLocale } from "next-intl";

export function UnifiedNav() {
  const { 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    activeMenuItem, 
    setActiveMenuItem 
  } = useUIStore();
  const isHydrated = useHydration();
  const t = useTranslations("nav");
  const locale = useLocale() as "en" | "es" | "fr" | "it" | "pt";
  
  const navigationItems = getNavigationItems(locale);

  const handleDesktopNavClick = (href: string) => {
    if (isHydrated) {
      setActiveMenuItem(href);
    }
  };

  const handleMobileNavClick = (href: string) => {
    if (isHydrated) {
      setActiveMenuItem(href);
      toggleMobileMenu(); // Close mobile menu when link is clicked
    }
  };

  const getNavLinkClasses = (href: string, isMobile = false) => {
    const baseClasses = isMobile 
      ? "flex items-center px-3 py-2 text-3xl font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground uppercase italic"
      : "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-xl font-medium transition-colors hover:bg-[#057ec8]/10 hover:text-[#057ec8] focus:bg-[#057ec8]/10 focus:text-[#057ec8] focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 uppercase italic";
    
    const activeClasses = isMobile
      ? "bg-accent text-accent-foreground"
      : "bg-gray-200 text-accent-foreground";
    
    return cn(
      baseClasses,
      isHydrated && activeMenuItem === href && activeClasses
    );
  };

  // Don't render mobile menu until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <>
        {/* Desktop Navigation */}
        <NavigationMenu className="hidden sm:flex gap-6 lg:gap-8">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <Link 
                  href={item.href} 
                  className={getNavLinkClasses(item.href)}
                  style={{ 
                    fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", Arial, sans-serif',
                    color: '#057ec8',
                    fontWeight: '600',
                    fontStyle: 'normal'
                  }}
                >
                  {item.translationKey ? t(item.translationKey) : item.label}
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Navigation Fallback */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </>
    );
  }

  return (
    <>
      {/* Desktop Navigation */}
      <NavigationMenu className="hidden sm:flex gap-6 lg:gap-8">
        <NavigationMenuList>
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              <Link 
                href={item.href}
                onClick={() => handleDesktopNavClick(item.href)}
                className={getNavLinkClasses(item.href)}
                style={{ 
                  fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", Arial, sans-serif',
                  color: '#057ec8',
                  fontWeight: '700',
                  fontStyle: 'normal'
                }}
              >
                {item.translationKey ? t(item.translationKey) : item.label}
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Mobile Navigation */}
      <div className="sm:hidden mr-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={toggleMobileMenu}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full bg-background/50 backdrop-blur-md [&>button]:hidden" aria-describedby={undefined}>
            <div className="flex flex-col h-full">
              <SheetHeader className="flex-shrink-0 h-20 flex items-center justify-end p-0 pr-9 pt-4">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <button
                  onClick={toggleMobileMenu}
                  className="h-7 w-7 flex items-center justify-center rounded-md bg-background/90 backdrop-blur-sm border border-border/50 hover:bg-background transition-colors shadow-lg"
                  aria-label="Close navigation menu"
                >
                  <X className="h-3 w-3" />
                </button>
              </SheetHeader>
              
              <nav className="flex-1 flex flex-col justify-center items-center">
                <ul className="space-y-6 text-center">
                  {navigationItems.map((item) => (
                    <li key={item.href} className="flex justify-center">
                    <Link
                      href={item.href}
                      onClick={() => handleMobileNavClick(item.href)}
                      className={getNavLinkClasses(item.href, true)}
                      style={{ 
                        fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", Arial, sans-serif',
                        color: '#057ec8',
                        fontWeight: '700',
                        fontStyle: 'normal',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                        {item.translationKey ? t(item.translationKey) : item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
