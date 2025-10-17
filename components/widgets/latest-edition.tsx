import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPostsByType, getTimeAgo } from "@/lib/content";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ErrorBoundary } from "@/components/shared/error-boundary";

interface LatestEditionProps {
  locale: "en" | "es" | "fr" | "it" | "pt";
}

export async function LatestEdition({ locale }: LatestEditionProps) {
  const t = await getTranslations({ locale, namespace: "content" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  
  const latestNews = getPostsByType("news", locale)[0];

  if (!latestNews) {
    return (
      <div className="w-full lg:w-3/4 space-y-4">
        <h2 className="text-2xl font-bold mb-6">{t("latestEdition")}</h2>
        <Card className="overflow-hidden">
          <div className="aspect-video bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-muted-foreground">No content available</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full lg:w-3/4 space-y-4">
        <h2 className="text-2xl font-bold mb-6">{t("latestEdition")}</h2>
        
        <Link href={latestNews.url} className="block">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            {latestNews.coverImage ? (
              <div className="aspect-video relative">
                <Image
                  src={latestNews.coverImage}
                  alt={latestNews.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                  priority
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-muted-foreground">Featured Image</span>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">
                  {tNav("news")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getTimeAgo(latestNews.date, locale)}
                </span>
              </div>
              <CardTitle className="text-2xl">
                {latestNews.title}
              </CardTitle>
              <CardDescription className="text-base">
                {latestNews.summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t("by")} {latestNews.author} • {latestNews.readingTime} {t("readingTime")}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </ErrorBoundary>
  );
}
