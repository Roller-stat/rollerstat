import { getPostsByType, filterAndSortPosts } from "@/lib/content";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PostCard } from "@/components/widgets/post-card";
import { DateFilter } from "@/components/widgets/date-filter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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

interface BlogsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    dateRange?: string;
    customDate?: string;
    sortOrder?: 'asc' | 'desc';
  }>;
}

export async function generateMetadata({ params }: BlogsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });

  return {
    title: `${t("blogs")} - Rollerstat`,
    description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    openGraph: {
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
      type: "website",
      locale: getOpenGraphLocale(locale),
      siteName: "Rollerstat",
      url: `https://rollerstat.com/${locale}/blogs`,
      images: [
        {
          url: "https://rollerstat.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${t("blogs")} - Rollerstat`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    },
    alternates: {
      canonical: `https://rollerstat.com/${locale}/blogs`,
      languages: {
        'x-default': 'https://rollerstat.com/en/blogs',
        'en': 'https://rollerstat.com/en/blogs',
        'es': 'https://rollerstat.com/es/blogs',
        'fr': 'https://rollerstat.com/fr/blogs',
        'it': 'https://rollerstat.com/it/blogs',
        'pt': 'https://rollerstat.com/pt/blogs',
      },
    },
  };
}

export default async function BlogsPage({ params, searchParams }: BlogsPageProps) {
  const { locale } = await params;
  const { page, dateRange, customDate, sortOrder } = await searchParams;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const tContent = await getTranslations({ locale, namespace: "content" });
  const tFilters = await getTranslations({ locale, namespace: "filters" });
  
  // Get all blogs
  const allBlogs = getPostsByType("blog", locale);
  
  // Apply filters and sorting
  const filteredBlogs = filterAndSortPosts(allBlogs, {
    dateRange: dateRange || 'all',
    customDate: customDate,
    sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
  });
  
  // Pagination on filtered results
  const POSTS_PER_PAGE = 9;
  const currentPage = Number(page) || 1;
  const totalPages = Math.ceil(filteredBlogs.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const blogs = filteredBlogs.slice(startIndex, endIndex);

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
            Discover insights, analysis, and stories from the world of roller hockey
          </p>
        </div>

        {/* Date Filter Component */}
        <DateFilter 
          locale={locale}
          currentFilters={{
            dateRange: dateRange || 'all',
            customDate: customDate,
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc'
          }}
        />

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {tFilters("showingResults", { 
            start: blogs.length > 0 ? startIndex + 1 : 0, 
            end: Math.min(endIndex, filteredBlogs.length), 
            total: filteredBlogs.length 
          })}
        </div>

        {blogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {blogs.map((blog, index) => (
              <PostCard
                key={blog._id}
                post={blog}
                locale={locale}
                badgeLabel={t("blogs")}
                byText={tContent("by")}
                readingTimeText={tContent("readingTime")}
                showTags={true}
                isPriority={index === 0}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {tFilters("noResults")}
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
                    <PaginationPrevious href={`/${locale}/blogs?page=${currentPage - 1}${dateRange && dateRange !== 'all' ? `&dateRange=${dateRange}` : ''}${customDate ? `&customDate=${customDate}` : ''}${sortOrder && sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ''}`} />
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
                          href={`/${locale}/blogs?page=${pageNum}${dateRange && dateRange !== 'all' ? `&dateRange=${dateRange}` : ''}${customDate ? `&customDate=${customDate}` : ''}${sortOrder && sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ''}`}
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
                    <PaginationNext href={`/${locale}/blogs?page=${currentPage + 1}${dateRange && dateRange !== 'all' ? `&dateRange=${dateRange}` : ''}${customDate ? `&customDate=${customDate}` : ''}${sortOrder && sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ''}`} />
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
