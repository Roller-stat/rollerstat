import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/widgets/hero-section";
import { LatestEdition } from "@/components/widgets/latest-edition";
import { TopStories } from "@/components/widgets/top-stories";
import { QuotesCarousel } from "@/components/widgets/quotes-carousel";
import { Footer } from "@/components/shared/footer";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  return {
    title: t("seo.title"),
  };
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
