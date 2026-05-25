import type { MetadataRoute } from "next";
import { absoluteUrl, getPostAlternates, getPublishedContentUrls, staticPageAlternates } from "@/lib/seo";
import { locales } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: staticPageAlternates((locale) => `/${locale}`),
      },
    },
    ...locales.flatMap((locale) => [
      {
        url: absoluteUrl(`/${locale}`),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/news`),
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/news`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/blogs`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/blogs`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/contact`),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.5,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/contact`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/privacy`),
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/privacy`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/terms`),
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/terms`),
        },
      },
      {
        url: absoluteUrl(`/${locale}/license`),
        lastModified: now,
        changeFrequency: "yearly" as const,
        priority: 0.3,
        alternates: {
          languages: staticPageAlternates((candidateLocale) => `/${candidateLocale}/license`),
        },
      },
    ]),
  ];

  const posts = await getPublishedContentUrls();
  const postEntries: MetadataRoute.Sitemap = await Promise.all(
    posts.map(async (post) => ({
      url: absoluteUrl(post.url),
      lastModified: new Date(post.updated || post.date),
      changeFrequency: post.contentType === "news" ? "daily" : "weekly",
      priority: post.contentType === "news" ? 0.9 : 0.8,
      alternates: {
        languages: await getPostAlternates(post),
      },
    })),
  );

  return [...staticEntries, ...postEntries];
}
