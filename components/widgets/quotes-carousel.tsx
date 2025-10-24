"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useQuotesCarousel } from "@/lib/hooks";
import { useTranslations } from "next-intl";

export function QuotesCarousel() {
  const t = useTranslations("quotes");
  const { currentQuote, setCurrentQuote, isHydrated } = useQuotesCarousel(4);
  
  // Always show the first quote on server-side to ensure hydration consistency
  const displayQuote = isHydrated ? currentQuote : 0;

  // Get the current quote data based on the display index
  const getCurrentQuote = () => {
    const quoteKeys = ["quote1", "quote2", "quote3", "quote4"];
    const currentKey = quoteKeys[displayQuote];
    return {
      text: t(`${currentKey}.text`),
      author: t(`${currentKey}.author`),
      role: t(`${currentKey}.role`)
    };
  };

  const currentQuoteData = getCurrentQuote();

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto rounded-none">
          <CardContent className="p-8 text-center">
            <blockquote className="text-xl md:text-2xl font-medium italic mb-6 text-foreground">
              &ldquo;{currentQuoteData.text}&rdquo;
            </blockquote>
            <div className="flex flex-col items-center">
              <cite className="font-semibold text-primary">
                {currentQuoteData.author}
              </cite>
              <span className="text-sm text-muted-foreground">
                {currentQuoteData.role}
              </span>
            </div>
            
            {/* Quote indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuote(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === displayQuote ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
