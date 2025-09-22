"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useQuotesCarousel } from "@/lib/hooks";

const quotes = [
  {
    text: "Roller hockey is not just a sport, it's a way of life that brings communities together across Europe.",
    author: "Marco Silva",
    role: "European Championship Coach"
  },
  {
    text: "The speed, skill, and strategy of roller hockey make it one of the most exciting sports to watch and play.",
    author: "Elena Rodriguez",
    role: "Professional Player"
  },
  {
    text: "Every match teaches us something new about teamwork, perseverance, and the beautiful game of roller hockey.",
    author: "Thomas Müller",
    role: "League Commissioner"
  },
  {
    text: "The passion for roller hockey runs deep in our veins, connecting players and fans across borders.",
    author: "Sophie Dubois",
    role: "Team Captain"
  }
];

export function QuotesCarousel() {
  const { currentQuote, setCurrentQuote, isHydrated } = useQuotesCarousel(quotes.length);
  
  // Always show the first quote on server-side to ensure hydration consistency
  const displayQuote = isHydrated ? currentQuote : 0;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <blockquote className="text-xl md:text-2xl font-medium italic mb-6 text-foreground">
              &ldquo;{quotes[displayQuote].text}&rdquo;
            </blockquote>
            <div className="flex flex-col items-center">
              <cite className="font-semibold text-primary">
                {quotes[displayQuote].author}
              </cite>
              <span className="text-sm text-muted-foreground">
                {quotes[displayQuote].role}
              </span>
            </div>
            
            {/* Quote indicators */}
            <div className="flex justify-center space-x-2 mt-6">
              {quotes.map((_, index) => (
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
