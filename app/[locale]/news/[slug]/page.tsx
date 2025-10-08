import { getPostBySlug, getRelatedPosts, formatDate } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";
import { MDXContent } from "@/components/shared/mdx-content";

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

interface NewsDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const post = getPostBySlug(slug, locale, "news");
  
  if (!post) {
    notFound();
  }

  // SEO metadata handled by locale layout

  return {
    title: `${post.title} - Rollerstat`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      locale: getOpenGraphLocale(locale),
      siteName: "Rollerstat",
      images: [
        ...(post.coverImage ? [{
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        }] : []),
        {
          url: "https://rollerstat.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Rollerstat - Your Source for Roller Hockey News",
        },
      ],
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: post.coverImage ? [post.coverImage] : ["https://rollerstat.com/og-image.jpg"],
    },
    alternates: {
      canonical: `https://rollerstat.com${post.url}`,
      languages: {
        'en': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/en/')}`,
        'es': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/es/')}`,
        'fr': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/fr/')}`,
        'it': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/it/')}`,
        'pt': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/pt/')}`,
      },
    },
  };
}

export async function generateStaticParams() {
  // This would be populated with actual slugs in a real implementation
  return [];
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const post = getPostBySlug(slug, locale, "news");
  
  if (!post) {
    notFound();
  }

  const t = await getTranslations("content");
  const relatedPosts = getRelatedPosts(post, 3);

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    image: post.coverImage,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Rollerstat",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://rollerstat.com"}/rollerstat-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "https://rollerstat.com"}${post.url}`,
    },
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <article className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default">{t("nav.news")}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(post.date, locale)}
                </span>
                {post.updated && (
                  <span className="text-sm text-muted-foreground">
                    • {t("content.updatedOn")} {formatDate(post.updated, locale)}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              
              <p className="text-xl text-muted-foreground mb-6">{post.summary}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t("content.by")} {post.author}</span>
                <span>•</span>
                <span>{post.readingTime} {t("content.readingTime")}</span>
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-video relative mb-8 rounded-lg overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-8">
              <MDXContent code={post.body.code} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{t("content.tags")}</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Placeholder for Like and Comments (Phase 3) */}
            <div className="border-t pt-8 mb-8">
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="sm">
                  👍 {t("interactions.like")}
                </Button>
                <Button variant="outline" size="sm">
                  💬 {t("interactions.comments")}
                </Button>
                <Button variant="outline" size="sm">
                  📤 {t("interactions.share")}
                </Button>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg text-center">
                <p className="text-muted-foreground">
                  Like and comment functionality will be available in Phase 3
                </p>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section className="border-t pt-8">
                <h2 className="text-2xl font-bold mb-6">{t("content.relatedPosts")}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost._id} className="hover:shadow-md transition-shadow">
                      {relatedPost.coverImage && (
                        <div className="aspect-video relative">
                          <Image
                            src={relatedPost.coverImage}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm leading-tight">
                          {relatedPost.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={relatedPost.url}>
                            {t("cta.readMore")} →
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </div>
    </>
  );
}
