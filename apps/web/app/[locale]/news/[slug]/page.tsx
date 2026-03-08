import { getPostBySlug, formatDate } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import Image from "next/image";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { PostReactions } from "@/components/interactions/post-reactions";
import { PostComments } from "@/components/interactions/post-comments";
import { isDatabaseConfigured } from "@/lib/db/client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const post = await getPostBySlug(slug, locale, "news");
  
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
      url: `https://rollerstat.com${post.url}`,
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
          alt: post.title,
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
        'x-default': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/en/')}`,
        'en': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/en/')}`,
        'es': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/es/')}`,
        'fr': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/fr/')}`,
        'it': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/it/')}`,
        'pt': `https://rollerstat.com${post.url.replace(`/${locale}/`, '/pt/')}`,
      },
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const post = await getPostBySlug(slug, locale, "news");
  
  if (!post) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "content" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const interactionsEnabled = isDatabaseConfigured();

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
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
          <article className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="default" className="rounded-none">{tNav("news")}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(post.date, locale)}
                </span>
                {post.updated && (
                  <span className="text-sm text-muted-foreground">
                    • {t("updatedOn")} {formatDate(post.updated, locale)}
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              
              <p className="text-xl text-muted-foreground mb-6">{post.summary}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t("by")} {post.author}</span>
                <span>•</span>
                <span>{post.readingTime} {t("readingTime")}</span>
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-video relative mb-8 overflow-hidden">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  className="object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="max-w-none mb-8">
              <div className="mdx-content">
                <MarkdownContent markdown={post.body?.raw || ""} />
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">{t("tags")}</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="rounded-none">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reactions + Comments */}
            {interactionsEnabled && (
              <div className="border-t pt-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <PostReactions postId={post.postId || post.id} postLocalizationId={post.id} />
                </div>
                <PostComments postId={post.postId || post.id} postLocalizationId={post.id} />
              </div>
            )}

          </article>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
