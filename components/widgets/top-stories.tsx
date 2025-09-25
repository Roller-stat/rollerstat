import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLatestBlogs, getTimeAgo } from "@/lib/content";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

interface TopStoriesProps {
  locale: "en" | "es" | "fr" | "de" | "it";
}

export function TopStories({ locale }: TopStoriesProps) {
  const t = useTranslations("content");
  const tCta = useTranslations("cta");
  
  const blogs = getLatestBlogs(locale, 4);

  return (
    <div className="w-full lg:w-1/4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">{t("topStories")}</h2>
      
      <div className="space-y-4">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <Card key={blog._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {blog.tags?.[0] || "Blog"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(blog.date, locale)}
                  </span>
                </div>
                <CardTitle className="text-sm leading-tight">
                  {blog.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs mb-3">
                  {blog.summary}
                </CardDescription>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-xs" asChild>
                  <Link href={blog.url}>
                    {tCta("readMore")} →
                  </Link>
                </Button>
              </CardContent>
            </Card>
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
