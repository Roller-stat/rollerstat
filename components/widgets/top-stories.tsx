import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
    <div className="w-full lg:w-2/5 space-y-4">
      <h2 className="text-2xl font-bold mb-6">{t("topStories")}</h2>
      
      <div className="space-y-4">
        {news.length > 0 ? (
          news.map((article) => (
            <Link key={article._id} href={article.url} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-none p-0 h-20 sm:h-22 md:h-24 lg:h-28">
                <div className="flex flex-row h-full">
                  {/* Image Section */}
                  {article.coverImage && (
                    <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 lg:w-28 lg:h-28 relative flex-shrink-0">
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="flex-1 p-2 sm:p-3 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <Badge variant="outline" className="text-[10px] sm:text-xs md:text-xs rounded-none">
                        {tNav("news")}
                      </Badge>
                      <span className="text-[10px] sm:text-xs md:text-xs text-muted-foreground">
                        {getTimeAgo(article.date, locale)}
                      </span>
                    </div>
                    <CardTitle className="text-xs sm:text-sm md:text-base leading-tight line-clamp-2 mb-1 sm:mb-1.5 mt-1 sm:mt-1.5" style={{ fontFamily: '"Castoro Titling", serif' }}>
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm line-clamp-1">
                      {article.summary}
                    </CardDescription>
                  </div>
                </div>
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
