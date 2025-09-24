"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVideoRotation } from "@/lib/hooks";

export function HeroSection() {
  // Array of video URLs - replace with your actual video URLs
  const videos = [
    "/videos/testclip1.mp4",
    "/videos/testclip2.mp4",
  ];

  const { currentVideoIndex, setCurrentVideoIndex } = useVideoRotation(videos);

  return (
    <section className="relative w-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
      
      {/* Desktop Layout: Videos Left, Text Right */}
      <div className="hidden md:flex items-stretch">
        {/* Video Section - Left Side (Dynamic Width Based on Video Aspect Ratio) */}
        <div className="relative flex-shrink-0 max-w-[50%]">
          <video
            key={currentVideoIndex}
            className="w-auto h-auto max-h-[80vh] object-contain"
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
        <div className="flex-1 relative z-10 flex items-center justify-center min-h-0 overflow-hidden">
          <div className="w-full max-w-lg px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex flex-col justify-center items-center h-full gap-[clamp(1rem,1vh,3rem)]">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight font-barlow-condensed">
                <span className="text-primary">Rollerstat</span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground font-barlow-condensed">
                Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button size="sm" className="sm:size-lg">
                  Subscribe to Newsletter
                </Button>
                <Button variant="outline" size="sm" className="sm:size-lg">
                  Read Latest News
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout: Text Top, Videos Bottom */}
      <div className="md:hidden flex flex-col h-full">
          {/* Text Content - Top */}
          <div className="flex-1 flex flex-col justify-center text-center space-y-6 mb-8 py-8 px-6">
            <h1 className="text-3xl font-bold tracking-tight font-barlow-condensed">
              <span className="text-primary">Rollerstat</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-barlow-condensed">
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
          
          {/* Video Section - Bottom (Full Width) */}
          <div className="flex-1 relative w-full">
            <video
              key={currentVideoIndex}
              className="w-full h-full object-contain"
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
    </section>
  );
}
