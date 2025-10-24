import { getPostsByType } from "@/lib/content";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PostCard } from "@/components/widgets/post-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

// Force dynamic rendering to always show latest posts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getOpenGraphLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'it': 'it_IT',
    'pt': 'pt_PT',
  };
  return localeMap[locale] || 'en_US';
}

interface NewsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({ params }: NewsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  
  return {
    title: `${t("news")} - Rollerstat`,
    description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
    openGraph: {
      title: `${t("news")} - Rollerstat`,
      description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
      type: "website",
      locale: getOpenGraphLocale(locale),
      siteName: "Rollerstat",
      url: `https://rollerstat.com/${locale}/news`,
      images: [
        {
          url: "https://rollerstat.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${t("news")} - Rollerstat`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("news")} - Rollerstat`,
      description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
    },
    alternates: {
      canonical: `https://rollerstat.com/${locale}/news`,
      languages: {
        'x-default': 'https://rollerstat.com/en/news',
        'en': 'https://rollerstat.com/en/news',
        'es': 'https://rollerstat.com/es/news',
        'fr': 'https://rollerstat.com/fr/news',
        'it': 'https://rollerstat.com/it/news',
        'pt': 'https://rollerstat.com/pt/news',
      },
    },
  };
}

export default async function NewsPage({ params, searchParams }: NewsPageProps) {
  const { locale } = await params;
  const { page } = await searchParams;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const tContent = await getTranslations({ locale, namespace: "content" });
  
  const allNews = getPostsByType("news", locale);
  const POSTS_PER_PAGE = 9;
  const currentPage = Number(page) || 1;
  const totalPages = Math.ceil(allNews.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const news = allNews.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 relative">
        {/* Background Image with 10% opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: 'url(/HeroBG.png)' }}
        />
        <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg">
            Stay updated with the latest roller hockey news and events
          </p>
        </div>

        {news.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {news.map((article, index) => (
              <PostCard
                key={article._id}
                post={article}
                locale={locale}
                badgeLabel={t("news")}
                byText={tContent("by")}
                readingTimeText={tContent("readingTime")}
                showTags={true}
                isPriority={index < 3}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No news articles available at the moment.
              </p>
            </CardContent>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/${locale}/news?page=${currentPage - 1}`} />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href={`/${locale}/news?page=${pageNum}`}
                          isActive={currentPage === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/${locale}/news?page=${currentPage + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
