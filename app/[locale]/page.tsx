import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/widgets/hero-section";
import { LatestEdition } from "@/components/widgets/latest-edition";
import { TopStories } from "@/components/widgets/top-stories";
import { QuotesCarousel } from "@/components/widgets/quotes-carousel";
import { Footer } from "@/components/shared/footer";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";

// Force dynamic rendering to always show latest posts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Configure how many blog posts to show (default: 2)
  // News posts will automatically adjust to match the height (blogCount * 4)
  const BLOG_COUNT = 2;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection />
        
        <section className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {await LatestEdition({ locale, blogCount: BLOG_COUNT })}
            {await TopStories({ locale, blogCount: BLOG_COUNT })}
          </div>
        </section>
        
        <QuotesCarousel />
      </main>
      
      <Footer />
    </div>
  );
}
