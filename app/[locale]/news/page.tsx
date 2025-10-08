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
  
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  
  return {
    title: `${t("news")} - Rollerstat`,
    description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
    keywords: tSeo("keywords"),
    openGraph: {
      title: `${t("news")} - Rollerstat`,
      description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
      type: "website",
      locale: locale,
      siteName: "Rollerstat",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("news")} - Rollerstat`,
      description: `Latest roller hockey news and updates in ${locale.toUpperCase()}`,
    },
    alternates: {
      canonical: `/${locale}/news`,
      languages: {
        'en': '/en/news',
        'es': '/es/news',
        'fr': '/fr/news',
        'it': '/it/news',
        'pt': '/pt/news',
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
  const tCta = await getTranslations({ locale, namespace: "cta" });
  const news = getPostsByType("news", locale);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("news")}</h1>
          <p className="text-muted-foreground text-lg">
            Stay updated with the latest roller hockey news and events
          </p>
        </div>

        {news.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {news.map((article) => (
              <Card key={article._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {article.coverImage && (
                  <div className="aspect-video relative">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default">{t("news")}</Badge>
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
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {tContent("by")} {article.author} • {article.readingTime} {tContent("readingTime")}
                    </div>
                    <Button asChild>
                      <Link href={article.url}>
                        {tCta("readMore")}
                      </Link>
                    </Button>
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
    </div>
  );
}
