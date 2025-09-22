import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  };
  
  const LogoIcon = () => (
    <div className={cn("relative flex-shrink-0", sizeClasses[size], className)}>
      <img
        src="/11.svg"
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
    </Link>
  );
}
