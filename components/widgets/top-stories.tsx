import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLatestBlogs, getTimeAgo } from "@/lib/content";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";

interface TopStoriesProps {
  locale: "en" | "es" | "fr" | "it" | "pt";
}

export async function TopStories({ locale }: TopStoriesProps) {
  const t = await getTranslations({ locale, namespace: "content" });
  
  const blogs = getLatestBlogs(locale, 4);

  return (
    <div className="w-full lg:w-1/4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">{t("topStories")}</h2>
      
      <div className="space-y-4">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <Link key={blog._id} href={blog.url} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                {blog.coverImage && (
                  <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
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
                  <CardDescription className="text-xs">
                    {blog.summary}
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
