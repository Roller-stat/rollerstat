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
];

export const navigationConfig = {
  breakpoints: {
    mobile: "md", // Hide desktop nav below md breakpoint
  },
  mobile: {
    drawerWidth: {
      default: "w-[300px]",
      sm: "sm:w-[400px]",
    },
  },
} as const;
