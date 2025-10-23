"use client";

import { useState, useEffect } from "react";

interface NewsletterContent {
  id: number;
  title: string;
  description: string;
  cta: string;
}

const newsletterContent: NewsletterContent[] = [
  {
    id: 1,
    title: "GET THE LATEST MATCH UPDATES",
    description: "Stay informed with real-time scores, highlights, and breaking news from roller hockey matches across Europe.",
    cta: "View Updates"
  },
  {
    id: 2,
    title: "SEE THE POST MATCH ANALYSIS",
    description: "Dive deep into tactical breakdowns, player performances, and expert insights from every major game.",
    cta: "Read Analysis"
  },
  {
    id: 3,
    title: "CHECK THE CHAMPIONSHIP STANDINGS",
    description: "Track your favorite teams' progress with comprehensive league tables and championship predictions.",
    cta: "View Standings"
  },
  {
    id: 4,
    title: "DISCOVER PLAYER SPOTLIGHTS",
    description: "Get to know the stars of European roller hockey with exclusive player profiles and interviews.",
    cta: "Meet Players"
  }
];

export function NewsletterOverlay() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => 
          (prevIndex + 1) % newsletterContent.length
        );
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentContent = newsletterContent[currentIndex];

  return (
    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-[90%] sm:w-[85%] md:w-[80%] lg:w-[75%] xl:w-[70%] max-w-6xl bg-gray-900/85 backdrop-blur-sm border border-white/5 shadow-xl z-50">
      <div className="px-3 py-3 sm:px-6 sm:py-5 md:px-8 md:py-10 lg:px-10 lg:py-14 xl:px-12 xl:py-16 h-full">
        <div className="flex flex-col items-center justify-center text-center h-full">
          {/* Centered Sliding Content */}
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div 
              className={`transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <h3 className="text-sm sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-serif text-white uppercase tracking-wide mb-1.5 sm:mb-3 md:mb-4 leading-tight">
                {currentContent.title}
              </h3>
              <p className="text-xs sm:text-base md:text-lg lg:text-xl text-gray-200 leading-snug sm:leading-relaxed px-1 sm:px-4 md:px-6 lg:px-8">
                {currentContent.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
