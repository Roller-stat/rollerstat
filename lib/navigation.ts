import { Locale } from "./i18n";

export interface NavigationItem {
  href: string;
  label: string;
  description?: string;
  translationKey?: string;
}

export const getNavigationItems = (locale: Locale = "en"): NavigationItem[] => [
  { href: `/${locale}`, label: "Home", translationKey: "home" },
  { href: `/${locale}/news`, label: "News", translationKey: "news" },
  { href: `/${locale}/blogs`, label: "Blogs", translationKey: "blogs" },
  { href: `/${locale}/contact`, label: "Contact", translationKey: "contact" },
  // { href: `/${locale}/signin`, label: "Sign In", translationKey: "cta.signin" },
  // { href: `/${locale}/login`, label: "Log In", translationKey: "cta.login" },
];

// Legacy navigation items for backward compatibility
export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

// Mobile drawer width configuration
export const mobileDrawerWidth = "w-[300px] sm:w-[400px]";
