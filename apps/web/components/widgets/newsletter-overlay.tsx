"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface NewsletterContent {
  id: number;
  title: string;
  description: string;
}

export function NewsletterOverlay() {
  const t = useTranslations("newsletter");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const newsletterContent: NewsletterContent[] = [
    {
      id: 1,
      title: t("content1.title"),
      description: t("content1.description")
    },
    {
      id: 2,
      title: t("content2.title"),
      description: t("content2.description")
    },
    {
      id: 3,
      title: t("content3.title"),
      description: t("content3.description")
    },
    {
      id: 4,
      title: t("content4.title"),
      description: t("content4.description")
    }
  ];

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
  }, [newsletterContent.length]);

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
