"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Array of video URLs - replace with your actual video URLs
  const videos = [
    "/videos/testclip1.mp4",
    "/videos/testclip2.mp4",
  ];

  // Auto-rotate videos based on their actual duration
  useEffect(() => {
    const videoElement = document.querySelector('video');
    let timeoutId: NodeJS.Timeout;

    const handleVideoEnd = () => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
    };

    const handleLoadedMetadata = () => {
      if (videoElement) {
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Set timeout based on video duration
        const duration = videoElement.duration * 1000; // Convert to milliseconds
        timeoutId = setTimeout(() => {
          setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
        }, duration);
      }
    };

    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('ended', handleVideoEnd);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('ended', handleVideoEnd);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentVideoIndex, videos.length]);

  return (
    <section className="relative w-full h-[60vh] min-h-[400px] bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
      
      {/* Desktop Layout: Videos Left, Text Right */}
      <div className="hidden md:flex h-full">
        {/* Video Section - Left Side (Full Height, No Container) */}
        <div className="w-1/2 relative">
          <video
            key={currentVideoIndex}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          >
            <source src={videos[currentVideoIndex]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Video indicator dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {videos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Text Content - Right Side */}
        <div className="w-1/2 relative z-10 flex items-center justify-center">
          <div className="w-full max-w-lg px-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">
                Your Source for Roller Hockey News
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Welcome to{" "}
                <span className="text-primary">Rollerstat</span>
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.
              </p>
              
              <div className="flex gap-4">
                <Button size="lg">
                  Subscribe to Newsletter
                </Button>
                <Button variant="outline" size="lg">
                  Read Latest News
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout: Text Top, Videos Bottom */}
      <div className="md:hidden flex flex-col h-full py-8 px-6">
          {/* Text Content - Top */}
          <div className="flex-1 flex flex-col justify-center text-center space-y-6 mb-8">
            <Badge variant="secondary" className="text-sm">
              Your Source for Roller Hockey News
            </Badge>
            
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to{" "}
              <span className="text-primary">Rollerstat</span>
            </h1>
            
            <p className="text-lg text-muted-foreground">
              Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.
            </p>
            
            <div className="flex flex-col gap-4">
              <Button size="lg">
                Subscribe to Newsletter
              </Button>
              <Button variant="outline" size="lg">
                Read Latest News
              </Button>
            </div>
          </div>
          
          {/* Video Section - Bottom */}
          <div className="flex-1">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
              <video
                key={currentVideoIndex}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              >
                <source src={videos[currentVideoIndex]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video indicator dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
    </section>
  );
}
