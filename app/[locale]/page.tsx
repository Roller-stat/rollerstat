import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/widgets/hero-section";
import { LatestEdition } from "@/components/widgets/latest-edition";
import { TopStories } from "@/components/widgets/top-stories";
import { QuotesCarousel } from "@/components/widgets/quotes-carousel";
import { Footer } from "@/components/shared/footer";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Content Section - Latest Edition (75%) and Top Stories (25%) */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <LatestEdition locale={locale} />
            <TopStories locale={locale} />
          </div>
        </section>
        
        <QuotesCarousel />
      </main>
      
      <Footer />
    </div>
  );
}
