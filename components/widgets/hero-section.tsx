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
        <div className="w-full flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl text-center">
            <div className="flex flex-col justify-center items-center space-y-4">
              {/* Small title text */}
              <h1 className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                <span className="text-primary">{t("title")}</span>
              </h1>
              
              {/* Main subtitle */}
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight font-barlow-condensed leading-tight text-muted-foreground">
                {t("subtitle")}
              </p>
              
              {/* Spacing before form */}
              <div className="pt-8 w-full">
                <div className="flex justify-center max-w-sm mx-auto">
                  <div className="flex w-full">
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-[4] rounded-none border-r-0 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 h-12 text-base"
                    />
                    <Button 
                      onClick={handleSubscribe}
                      className="flex-[1] rounded-none bg-gray-900 hover:bg-black text-white border border-gray-300 border-l-0 px-3 h-12 font-semibold text-base uppercase tracking-wide"
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
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-4xl">
            <video
              key={currentVideoIndex}
              className="w-full h-auto max-h-[60vh] object-contain"
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
          <div className="flex-1 flex flex-col justify-center text-center space-y-8 mb-8 py-12 px-6">
            {/* Small title text */}
            <h1 className="text-sm text-gray-500 font-medium tracking-wide uppercase">
              <span className="text-primary">{t("title")}</span>
            </h1>
            
            {/* Main subtitle */}
            <p className="text-2xl sm:text-3xl font-bold tracking-tight font-barlow-condensed leading-tight text-muted-foreground">
              {t("subtitle")}
            </p>
            
            {/* Spacing before form */}
            <div className="pt-4">
              <div className="flex justify-center max-w-sm mx-auto">
                <div className="flex w-full">
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 rounded-none border-r-0 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:ring-0 h-12 text-base"
                  />
                  <Button 
                    onClick={handleSubscribe}
                    className="flex-1 rounded-none bg-gray-900 hover:bg-black text-white border border-gray-300 border-l-0 px-3 h-12 font-semibold text-base uppercase tracking-wide"
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
