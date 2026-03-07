"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { TextScramble } from "@/components/motion-primitives/text-scramble";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  size?: "xxs" | "xs" | "sm" | "md" | "ml" | "lg";
  mobileSize?: "xxs" | "xs" | "sm" | "md" | "ml" | "lg";
  showText?: boolean;
  href?: string;
  animateOnMount?: boolean;
  loop?: boolean;
  loopDelay?: number;
  color?: string;
}

export function Logo({ 
  className, 
  size = "md", 
  mobileSize,
  showText = true, 
  href = "/",
  animateOnMount = true,
  loop = false,
  loopDelay = 2000,
  color = "var(--logo-color)"
}: LogoProps) {
  const textSizeClasses = {
    xxs: "text-xs",
    xs: "text-sm",
    sm: "text-lg",
    md: "text-2xl",
    ml: "text-2xl", 
    lg: "text-3xl"
  };

  const fontSizeStyles = {
    xxs: "1rem",
    xs: "1.2rem", 
    sm: "1.5rem",
    md: "2rem",
    ml: "3rem",
    lg: "4rem"
  };

  const [triggerAnimation, setTriggerAnimation] = useState(false);

  useEffect(() => {
    if (!loop) return;

    const startLoop = () => {
      // Initial delay before first animation
      const initialTimeout = setTimeout(() => {
        setTriggerAnimation(true);
      }, 1000);

      return () => clearTimeout(initialTimeout);
    };

    const cleanup = startLoop();

    return cleanup;
  }, [loop]);

  const handleScrambleComplete = () => {
    if (!loop) return;

    // Reset trigger to false first
    setTriggerAnimation(false);
    
    // Wait for the specified delay, then trigger next animation
    setTimeout(() => {
      setTriggerAnimation(true);
    }, loopDelay);
  };
  
  const LogoText = () => (
    <div className={cn("relative flex-shrink-0", className)}>
      <TextScramble
        as="span"
        className={cn(
          "font-bold tracking-tight",
          textSizeClasses[size]
        )}
        style={{ 
          fontFamily: 'var(--font-barlow-condensed), "Barlow Condensed", Arial, sans-serif',
          color: color,
          display: 'block',
          fontSize: mobileSize ? `clamp(${fontSizeStyles[mobileSize]}, 4vw, ${fontSizeStyles[size]})` : fontSizeStyles[size],
          fontWeight: '700',
          fontStyle: 'italic',
          lineHeight: '1',
          textTransform: 'uppercase'
        }}
        duration={1.2}
        speed={0.05}
        trigger={loop ? triggerAnimation : animateOnMount}
        onScrambleComplete={handleScrambleComplete}
        characterSet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
      >
        ROLLERSTAT
      </TextScramble>
    </div>
  );

  if (!showText) {
    return href ? (
      <Link href={href} className="inline-block">
        <LogoText />
      </Link>
    ) : (
      <LogoText />
    );
  }

  return (
    <Link href={href} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
      <LogoText />
    </Link>
  );
}
