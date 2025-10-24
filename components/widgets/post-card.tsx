import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { Post } from "contentlayer/generated";
import { getTimeAgo } from "@/lib/content";

interface PostCardProps {
  post: Post;
  locale: "en" | "es" | "fr" | "it" | "pt";
  badgeLabel: string;
  byText: string;
  readingTimeText: string;
  showTags?: boolean;
  isPriority?: boolean;
}

export function PostCard({ 
  post, 
  locale, 
  badgeLabel, 
  byText, 
  readingTimeText, 
  showTags = false,
  isPriority = false 
}: PostCardProps) {
  const imageUrl = post.coverImage || "/RSgithub.jpg";

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
          {showTags && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs rounded-none">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
        <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 relative">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isPriority}
            className="object-cover"
          />
        </div>
      </Card>
    </Link>
  );
}

