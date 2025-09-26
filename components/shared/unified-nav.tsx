"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
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
import { getNavigationItems, mobileDrawerWidth } from "@/lib/navigation";
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
      ? "flex items-center px-3 py-2 text-3xl font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
      : "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-xl font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50";
    
    const activeClasses = isMobile
      ? "bg-accent text-accent-foreground"
      : "bg-accent/50 text-accent-foreground";
    
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
          <SheetContent side="left" className="w-full bg-background/50 backdrop-blur-md" aria-describedby={undefined}>
            <div className="flex flex-col h-full">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle>
                </SheetTitle>
              </SheetHeader>
              
              <nav className="flex-1 flex flex-col justify-center items-center">
                <ul className="space-y-6 text-center">
                  {navigationItems.map((item) => (
                    <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => handleMobileNavClick(item.href)}
                      className={getNavLinkClasses(item.href, true)}
                      style={{ 
                        fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", Arial, sans-serif',
                        color: '#057ec8',
                        fontWeight: '600',
                        fontStyle: 'normal'
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
