"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVideoRotation } from "@/lib/hooks";
import { useTranslations } from "next-intl";
import { NewsletterOverlay } from "./newsletter-overlay";
import { toast } from "sonner";

export function HeroSection() {
  const t = useTranslations("hero");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Array of video URLs - replace with your actual video URLs
  const videos = [
    "/videos/testclip1.mp4",
    "/videos/testclip2.mp4",
  ];

  const { currentVideoIndex, setCurrentVideoIndex } = useVideoRotation(videos);

  const handleSubscribe = async () => {
    // Basic validation
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      // Handle already subscribed case (409 status)
      if (response.status === 409 || data.alreadySubscribed) {
        toast.info("You're already subscribed to our newsletter!");
        setIsSubscribed(true);
        setEmail(""); // Clear the input
      } else if (data.success) {
        toast.success("Successfully subscribed to our newsletter!");
        setIsSubscribed(true);
        setEmail(""); // Clear the input
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      console.error('Error details:', error);
      toast.error("Failed to subscribe. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative w-full bg-background overflow-visible pb-14 sm:pb-18 md:pb-24 lg:pb-28 xl:pb-36">
      {/* Background Image with 10% opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
        style={{ backgroundImage: 'url(/HeroBG.png)' }}
      />
      
      {/* Desktop Layout: Text Top, Video Bottom */}
      <div className="hidden md:flex flex-col relative z-10">
        {/* Text Content - Top Section */}
        <div className="w-full flex items-center justify-center px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24" style={{ height: '50vh' }}>
          <div className="w-full max-w-4xl text-center">
            <div className="flex flex-col justify-center items-center space-y-4">
              {/* Main heading */}
              <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-tight text-muted-foreground uppercase" style={{ fontFamily: '"Castoro Titling", serif' }}>
                {t("headingPart1")} <span className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl text-black" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>{t("headingPart2")}</span> {t("headingPart3")} <span className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl text-black" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>{t("headingPart4")}</span>.
              </h1>
              
              {/* Spacing before form */}
              <div className="w-full">
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
                      disabled={isLoading || isSubscribed}
                      className={`flex-[1] rounded-none border border-gray-300 border-l-0 px-1 sm:px-2 md:px-3 lg:px-4 h-8 sm:h-10 md:h-12 lg:h-14 font-semibold text-xs sm:text-xs md:text-sm lg:text-sm uppercase tracking-wide ${
                        isSubscribed 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : isLoading 
                            ? 'bg-gray-600 hover:bg-gray-600 text-white' 
                            : 'bg-gray-900 hover:bg-black text-white'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Subscribing...</span>
                        </div>
                      ) : isSubscribed ? (
                        "✓ Subscribed!"
                      ) : (
                        t("subscribeButton")
                      )}
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
            
            {/* Newsletter Overlay */}
            <NewsletterOverlay />
            
            {/* Video indicator dots */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
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
      <div className="md:hidden flex flex-col h-full relative z-10">
          {/* Text Content - Top */}
          <div className="flex-1 flex flex-col justify-center text-center space-y-4 py-12 px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            {/* Main heading */}
            <h1 className="text-2xl sm:text-3xl tracking-tight leading-relaxed text-muted-foreground uppercase" style={{ fontFamily: '"Castoro Titling", serif', lineHeight: '1.8' }}>
              {t("headingPart1")} <span className="text-3xl sm:text-4xl text-black" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>{t("headingPart2")}</span> {t("headingPart3")} <span className="text-3xl sm:text-4xl text-black" style={{ fontFamily: 'var(--font-allura), "Allura", cursive', textTransform: 'capitalize' }}>{t("headingPart4")}</span>.
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
                    disabled={isLoading || isSubscribed}
                    className={`flex-[1] rounded-none border border-gray-300 border-l-0 px-2 sm:px-2 h-8 sm:h-10 font-semibold text-[10px] sm:text-sm uppercase tracking-wide ${
                      isSubscribed 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : isLoading 
                          ? 'bg-gray-600 hover:bg-gray-600 text-white' 
                          : 'bg-gray-900 hover:bg-black text-white'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[8px] sm:text-[10px]">Subscribing...</span>
                      </div>
                    ) : isSubscribed ? (
                      "✓ Subscribed!"
                    ) : (
                      t("subscribeButton")
                    )}
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
            
            {/* Newsletter Overlay */}
            <NewsletterOverlay />
            
            {/* Video indicator dots */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
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
