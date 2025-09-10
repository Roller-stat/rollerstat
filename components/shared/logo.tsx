import Link from "next/link";
import { cn } from "@/lib/utils";
import { navbarConfig } from "@/lib/navbar-config";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string;
}

export function Logo({ 
  className, 
  size = "md", 
  showText = true, 
  href = "/" 
}: LogoProps) {
  const config = navbarConfig.logo.sizes[size];
  
  const LogoIcon = () => (
    <div className={cn("relative flex-shrink-0", config.container, className)}>
      <img
        src="/rollerstat-logo.png"
        alt="Rollerstat Logo"
        className="w-full h-full object-contain"
        style={{ 
          imageRendering: '-webkit-optimize-contrast'
        }}
        loading="eager"
      />
    </div>
  );

  if (!showText) {
    return href ? (
      <Link href={href} className="inline-block">
        <LogoIcon />
      </Link>
    ) : (
      <LogoIcon />
    );
  }

  return (
    <Link href={href} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
      <LogoIcon />
      <span className={cn("font-bold text-foreground", config.text)}>
        Rollerstat
      </span>
    </Link>
  );
}
