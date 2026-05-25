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
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE,
  getOpenGraphLocale,
  getPostAlternates,
  ORGANIZATION_LOGO,
  SITE_NAME,
} from "@/lib/seo";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const canonicalUrl = absoluteUrl(post.url);
  const imageUrl = post.coverImage ? absoluteUrl(post.coverImage) : DEFAULT_OG_IMAGE;
  const languages = await getPostAlternates(post);

  return {
    title: `${post.title} - ${SITE_NAME}`,
    description: post.summary,
    keywords: [...post.tags, "roller hockey", "quad hockey", "rink hockey", "European roller hockey", "Rollerstat"],
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      locale: getOpenGraphLocale(locale),
      siteName: SITE_NAME,
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      section: "Roller Hockey News",
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
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
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary,
    image: [post.coverImage ? absoluteUrl(post.coverImage) : DEFAULT_OG_IMAGE],
    datePublished: post.date,
    dateModified: post.updated || post.date,
    articleSection: "Roller Hockey News",
    keywords: post.tags,
    about: [
      {
        "@type": "Sport",
        name: "Roller hockey",
        alternateName: ["quad hockey", "rink hockey"],
      },
    ],
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION_LOGO,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(post.url),
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
