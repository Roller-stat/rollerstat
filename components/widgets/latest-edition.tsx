import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLatestBlogs, getTimeAgo } from "@/lib/content";
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
  
  // Get only blog posts sorted by date, most recent first
  const blogPosts = getLatestBlogs(locale, 2);
  const latestPost = blogPosts[0];
  const secondLatestPost = blogPosts[1];

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
      <div className="w-full lg:w-3/5 space-y-4">
        <h2 className="text-2xl font-bold mb-6">{t("latestEdition")}</h2>
        
        {/* Latest Post (News or Blog) */}
        <Link href={latestPost.url} className="block">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer rounded-none pt-6 pb-0 h-auto gap-2">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 mb-0">
                <Badge variant="default" className="rounded-none">
                  {tNav("blogs")}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getTimeAgo(latestPost.date, locale)}
                </span>
              </div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 mb-0" style={{ fontFamily: '"Castoro Titling", serif' }}>
                {latestPost.title}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base line-clamp-2">
                {latestPost.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-0 pt-0 mb-3">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {t("by")} {latestPost.author} • {latestPost.readingTime} {t("readingTime")}
              </div>
            </CardContent>
            {latestPost.coverImage ? (
              <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 relative">
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
              <div className="w-full h-64 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                <span className="text-muted-foreground">Featured Image</span>
              </div>
            )}
          </Card>
        </Link>

        {/* Second Latest Post (News or Blog) */}
        {secondLatestPost && (
          <Link href={secondLatestPost.url} className="block">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer rounded-none pt-6 pb-0 h-auto gap-2">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 mb-0">
                  <Badge variant="default" className="rounded-none">
                    {tNav("blogs")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(secondLatestPost.date, locale)}
                  </span>
                </div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 mb-0" style={{ fontFamily: '"Castoro Titling", serif' }}>
                  {secondLatestPost.title}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base line-clamp-2">
                  {secondLatestPost.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0 pt-0 mb-3">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t("by")} {secondLatestPost.author} • {secondLatestPost.readingTime} {t("readingTime")}
                </div>
              </CardContent>
              {secondLatestPost.coverImage ? (
                <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 relative">
                  <Image
                    src={secondLatestPost.coverImage}
                    alt={secondLatestPost.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
                    priority
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-muted-foreground">Featured Image</span>
                </div>
              )}
            </Card>
          </Link>
        )}
      </div>
    </ErrorBoundary>
  );
}
