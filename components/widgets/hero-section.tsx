"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative w-full h-[60vh] min-h-[400px] bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full animate-pulse"></div>
      <div className="absolute top-32 right-20 w-16 h-16 bg-secondary/10 rounded-full animate-bounce"></div>
      <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-accent/10 rounded-full animate-pulse delay-1000"></div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center space-y-6">
        <Badge variant="secondary" className="text-sm">
          Your Source for Roller Hockey News
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Welcome to{" "}
          <span className="text-primary">Rollerstat</span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl">
          Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="w-full sm:w-auto">
            Subscribe to Newsletter
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            Read Latest News
          </Button>
        </div>
      </div>
    </section>
  );
}
