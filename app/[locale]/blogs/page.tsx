import { getPostsByType } from "@/lib/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { getTimeAgo } from "@/lib/content";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";

interface BlogsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: BlogsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });

  return {
    title: `${t("blogs")} - Rollerstat`,
    description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    keywords: tSeo("keywords"),
    openGraph: {
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
      type: "website",
      locale: locale,
      siteName: "Rollerstat",
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    },
    alternates: {
      canonical: `/${locale}/blogs`,
      languages: {
        'en': '/en/blogs',
        'es': '/es/blogs',
        'fr': '/fr/blogs',
        'it': '/it/blogs',
        'pt': '/pt/blogs',
      },
    },
  };
}

export default async function BlogsPage({ params }: BlogsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "nav" });
  const tCta = await getTranslations({ locale, namespace: "cta" });
  const tContent = await getTranslations({ locale, namespace: "content" });
  const blogs = getPostsByType("blog", locale);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("blogs")}</h1>
          <p className="text-muted-foreground text-lg">
            Discover insights, analysis, and stories from the world of roller hockey
          </p>
        </div>

        {blogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Card key={blog._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {blog.coverImage && (
                  <div className="aspect-video relative">
                    <Image
                      src={blog.coverImage}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{t("blogs")}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {getTimeAgo(blog.date, locale)}
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    {blog.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {blog.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {tContent("by")} {blog.author} • {blog.readingTime} {tContent("readingTime")}
                    </div>
                    <Button asChild>
                      <Link href={blog.url}>
                        {tCta("readMore")}
                      </Link>
                    </Button>
                  </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {blog.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No blog articles available at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
