export interface NavigationItem {
  href: string;
  label: string;
  description?: string;
}

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/blogs", label: "Blogs" },
  { href: "/contact", label: "Contact" },
  { href: "/signin", label: "Sign In" },
  { href: "/login", label: "Log In" },
];

// Mobile drawer width configuration
export const mobileDrawerWidth = "w-[300px] sm:w-[400px]";
