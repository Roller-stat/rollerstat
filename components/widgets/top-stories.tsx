import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPostsByType, getTimeAgo } from "@/lib/content";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";

interface TopStoriesProps {
  locale: "en" | "es" | "fr" | "it" | "pt";
}

export async function TopStories({ locale }: TopStoriesProps) {
  const t = await getTranslations({ locale, namespace: "content" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  
  const news = getPostsByType("news", locale).slice(0, 4);

  return (
    <div className="w-full lg:w-1/4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">{t("topStories")}</h2>
      
      <div className="space-y-4">
        {news.length > 0 ? (
          news.map((article) => (
            <Link key={article._id} href={article.url} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                {article.coverImage && (
                  <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {tNav("news")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(article.date, locale)}
                    </span>
                  </div>
                  <CardTitle className="text-sm leading-tight">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    {article.summary}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                {t("errors.loading")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
