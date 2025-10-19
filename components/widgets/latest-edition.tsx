import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPostsByLocale, getTimeAgo } from "@/lib/content";
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
  
  // Get all posts (news and blogs) sorted by date, most recent first
  const allPosts = getPostsByLocale(locale);
  const latestPost = allPosts[0];
  const secondLatestPost = allPosts[1];

  if (!latestPost) {
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
        
        {/* Latest Post (News or Blog) */}
        <Link href={latestPost.url} className="block">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
            {latestPost.coverImage ? (
              <div className="aspect-video relative">
                <Image
                  src={latestPost.coverImage}
                  alt={latestPost.title}
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
                  {latestPost.contentType === "news" ? tNav("news") : tNav("blogs")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getTimeAgo(latestPost.date, locale)}
                </span>
              </div>
              <CardTitle className="text-2xl">
                {latestPost.title}
              </CardTitle>
              <CardDescription className="text-base">
                {latestPost.summary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {t("by")} {latestPost.author} • {latestPost.readingTime} {t("readingTime")}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Second Latest Post (News or Blog) */}
        {secondLatestPost && (
          <Link href={secondLatestPost.url} className="block">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              {secondLatestPost.coverImage ? (
                <div className="aspect-video relative">
                  <Image
                    src={secondLatestPost.coverImage}
                    alt={secondLatestPost.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
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
                    {secondLatestPost.contentType === "news" ? tNav("news") : tNav("blogs")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(secondLatestPost.date, locale)}
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {secondLatestPost.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {secondLatestPost.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {t("by")} {secondLatestPost.author} • {secondLatestPost.readingTime} {t("readingTime")}
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </ErrorBoundary>
  );
}
