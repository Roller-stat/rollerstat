"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVideoRotation } from "@/lib/hooks";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("hero");
  const [email, setEmail] = useState("");
  
  // Array of video URLs - replace with your actual video URLs
  const videos = [
    "/videos/testclip1.mp4",
    "/videos/testclip2.mp4",
  ];

  const { currentVideoIndex, setCurrentVideoIndex } = useVideoRotation(videos);

  const handleSubscribe = () => {
    if (email && email.includes("@")) {
      // TODO: Implement actual subscription logic
      console.log("Subscribing email:", email);
      setEmail(""); // Clear the input after subscription
    }
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-primary/20 via-background to-secondary/20 overflow-hidden">
      
      {/* Desktop Layout: Text Top, Video Bottom */}
      <div className="hidden md:flex flex-col">
        {/* Text Content - Top Section */}
        <div className="w-full flex items-center justify-center py-24 px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24">
          <div className="w-full max-w-4xl text-center">
            <div className="flex flex-col justify-center items-center space-y-4">
              {/* Main heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight text-muted-foreground uppercase" style={{ fontFamily: '"Castoro Titling", serif' }}>
                Latest news and insights from the world of <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>Roller Hockey</span> across <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>Europe</span>.
              </h1>
              
              {/* Spacing before form */}
              <div className="pt-8 w-full">
                <div className="flex justify-center max-w-64 sm:max-w-72 md:max-w-80 lg:max-w-96 mx-auto">
                  <div className="flex w-full">
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-[5] rounded-none border-r-0 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 h-8 sm:h-10 md:h-12 lg:h-14 text-xs sm:text-sm md:text-base lg:text-lg"
                    />
                    <Button 
                      onClick={handleSubscribe}
                      className="flex-[1] rounded-none bg-gray-900 hover:bg-black text-white border border-gray-300 border-l-0 px-1 sm:px-2 md:px-3 lg:px-4 h-8 sm:h-10 md:h-12 lg:h-14 font-semibold text-xs sm:text-xs md:text-sm lg:text-sm uppercase tracking-wide"
                    >
                      {t("subscribeButton")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Section - Bottom Section */}
        <div className="w-full">
          <div className="relative w-full">
            <video
              key={currentVideoIndex}
              className="w-full h-auto object-contain"
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

      {/* Mobile Layout: Text Top, Videos Bottom */}
      <div className="md:hidden flex flex-col h-full">
          {/* Text Content - Top */}
          <div className="flex-1 flex flex-col justify-center text-center space-y-4 mb-8 py-12 px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            {/* Main heading */}
            <h1 className="text-2xl sm:text-3xl tracking-tight leading-relaxed text-muted-foreground uppercase" style={{ fontFamily: '"Castoro Titling", serif', lineHeight: '1.8' }}>
              Latest news and insights from the world of <span className="text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>Roller Hockey</span> across <span className="text-3xl sm:text-4xl" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>Europe</span>.
            </h1>
            
            {/* Spacing before form */}
            <div className="pt-2">
              <div className="flex justify-center max-w-56 sm:max-w-64 mx-auto">
                <div className="flex w-full">
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-[5] rounded-none border-r-0 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 h-8 sm:h-10 text-[10px] sm:text-sm placeholder:text-[10px] sm:placeholder:text-sm"
                  />
                  <Button 
                    onClick={handleSubscribe}
                    className="flex-[1] rounded-none bg-gray-900 hover:bg-black text-white border border-gray-300 border-l-0 px-2 sm:px-2 h-8 sm:h-10 font-semibold text-[10px] sm:text-sm uppercase tracking-wide"
                  >
                    {t("subscribeButton")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Section - Bottom (Full Width) */}
          <div className="flex-1 relative w-full">
            <video
              key={currentVideoIndex}
              className="w-full h-auto object-contain"
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
