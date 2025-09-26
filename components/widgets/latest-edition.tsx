import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLatestPost, getTimeAgo } from "@/lib/content";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ErrorBoundary } from "@/components/shared/error-boundary";

interface LatestEditionProps {
  locale: "en" | "es" | "fr" | "it" | "pt";
}

export function LatestEdition({ locale }: LatestEditionProps) {
  const t = useTranslations("content");
  const tNav = useTranslations("nav");
  const tCta = useTranslations("cta");
  
  const latestPost = getLatestPost(locale);

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
        
        <Card className="overflow-hidden">
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
              <Badge variant={latestPost.contentType === "news" ? "default" : "secondary"}>
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t("by")} {latestPost.author} • {latestPost.readingTime} {t("readingTime")}
              </div>
              <Button asChild>
                <Link href={latestPost.url}>
                  {tCta("readMore")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
