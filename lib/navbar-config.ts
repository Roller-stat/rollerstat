export const navbarConfig = {
  // Navbar dimensions
  height: {
    mobile: "h-16",
    desktop: "h-20"
  },
  
  // Logo sizing
  logo: {
    sizes: {
      sm: { 
        container: "h-7 w-7", 
        text: "text-lg"
      },
      md: { 
        container: "h-10 w-10", 
        text: "text-xl"
      },
      lg: { 
        container: "h-12 w-12", 
        text: "text-2xl"
      }
    }
  },
  
  // Spacing and layout
  spacing: {
    container: "px-4 sm:px-6 lg:px-8",
    logoMargin: "ml-4 sm:ml-6 lg:ml-8",
    navGap: "gap-6 lg:gap-8"
  },
  
  // Breakpoints
  breakpoints: {
    mobile: "md",
    tablet: "lg"
  }
} as const;
