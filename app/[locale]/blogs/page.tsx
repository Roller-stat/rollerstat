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
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

function getOpenGraphLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'en': 'en_US',
    'es': 'es_ES',
    'fr': 'fr_FR',
    'it': 'it_IT',
    'pt': 'pt_PT',
  };
  return localeMap[locale] || 'en_US';
}

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

  return {
    title: `${t("blogs")} - Rollerstat`,
    description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    openGraph: {
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
      type: "website",
      locale: getOpenGraphLocale(locale),
      siteName: "Rollerstat",
      url: `https://rollerstat.com/${locale}/blogs`,
      images: [
        {
          url: "https://rollerstat.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: `${t("blogs")} - Rollerstat`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("blogs")} - Rollerstat`,
      description: `Latest roller hockey analysis, insights, and stories in ${locale.toUpperCase()}`,
    },
    alternates: {
      canonical: `https://rollerstat.com/${locale}/blogs`,
      languages: {
        'x-default': 'https://rollerstat.com/en/blogs',
        'en': 'https://rollerstat.com/en/blogs',
        'es': 'https://rollerstat.com/es/blogs',
        'fr': 'https://rollerstat.com/fr/blogs',
        'it': 'https://rollerstat.com/it/blogs',
        'pt': 'https://rollerstat.com/pt/blogs',
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg">
            Discover insights, analysis, and stories from the world of roller hockey
          </p>
        </div>

        {blogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <Link key={blog._id} href={blog.url} className="block">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {blog.coverImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={blog.coverImage}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                    <div className="text-sm text-muted-foreground">
                      {tContent("by")} {blog.author} • {blog.readingTime} {tContent("readingTime")}
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
              </Link>
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
      </main>
      <Footer />
    </div>
  );
}
