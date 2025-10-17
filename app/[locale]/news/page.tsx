import { getPostsByType } from "@/lib/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { getTimeAgo, formatDate } from "@/lib/content";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

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

export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const tContent = await getTranslations({ locale, namespace: "content" });
  const news = getPostsByType("news", locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg">
            Stay updated with the latest roller hockey news and events
          </p>
        </div>

        {news.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <Link key={article._id} href={article.url} className="block">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {article.coverImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">
                        {getTimeAgo(article.date, locale)}
                      </span>
                    </div>
                    <CardTitle className="text-xl leading-tight">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {article.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {tContent("by")} {article.author} • {article.readingTime} {tContent("readingTime")}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
