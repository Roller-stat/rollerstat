import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLatestBlogs, getTimeAgo } from "@/lib/content";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Post } from "contentlayer/generated";

interface LatestEditionProps {
  locale: "en" | "es" | "fr" | "it" | "pt";
  blogCount?: number;
}

interface BlogCardProps {
  post: Post;
  locale: "en" | "es" | "fr" | "it" | "pt";
  badgeLabel: string;
  byText: string;
  readingTimeText: string;
  isPriority?: boolean;
}

function BlogCard({ post, locale, badgeLabel, byText, readingTimeText, isPriority = false }: BlogCardProps) {
  return (
    <Link href={post.url} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer rounded-none pt-4 sm:pt-5 md:pt-6 lg:pt-5 xl:pt-6 pb-0 h-auto gap-2">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 mb-0">
            <Badge variant="default" className="rounded-none">
              {badgeLabel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getTimeAgo(post.date, locale)}
            </span>
          </div>
          <CardTitle className="text-lg sm:text-xl md:text-2xl line-clamp-2 mb-0" style={{ fontFamily: '"Castoro Titling", serif' }}>
            {post.title}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base line-clamp-2">
            {post.summary}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-0 pt-0 mb-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {byText} {post.author} • {post.readingTime} {readingTimeText}
          </div>
        </CardContent>
        {post.coverImage ? (
          <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
              priority={isPriority}
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
  );
}

export async function LatestEdition({ locale, blogCount = 2 }: LatestEditionProps) {
  const t = await getTranslations({ locale, namespace: "content" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  
  // Get only blog posts sorted by date, most recent first
  const blogPosts = getLatestBlogs(locale, blogCount);

  if (blogPosts.length === 0) {
    return (
      <div className="w-full lg:w-3/5 space-y-4">
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
        
        {blogPosts.map((post, index) => (
          <BlogCard
            key={post._id}
            post={post}
            locale={locale}
            badgeLabel={tNav("blogs")}
            byText={t("by")}
            readingTimeText={t("readingTime")}
            isPriority={index === 0}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}
