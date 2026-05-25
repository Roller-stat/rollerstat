import { getAllPosts, type ContentType, type PostRecord } from "@/lib/content";
import { defaultLocale, locales, type Locale } from "@/lib/i18n";

export const SITE_URL = "https://rollerstat.com";
export const SITE_NAME = "Rollerstat";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const ORGANIZATION_LOGO = `${SITE_URL}/rollerstat-logo.png`;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getOpenGraphLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    en: "en_US",
    es: "es_ES",
    fr: "fr_FR",
    it: "it_IT",
    pt: "pt_PT",
  };

  return localeMap[locale] || "en_US";
}

export function staticPageAlternates(pathForLocale: (locale: Locale) => string): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": absoluteUrl(pathForLocale(defaultLocale)),
  };

  for (const locale of locales) {
    languages[locale] = absoluteUrl(pathForLocale(locale));
  }

  return languages;
}

function translationGroup(post: PostRecord): string {
  return post.translation_key || post.postId || `${post.contentType}:${post.slug}`;
}

export async function getPostAlternates(post: PostRecord): Promise<Record<string, string>> {
  const posts = await getAllPosts();
  const group = translationGroup(post);
  const translations = posts.filter(
    (candidate) =>
      candidate.published !== false &&
      candidate.contentType === post.contentType &&
      translationGroup(candidate) === group,
  );

  const languages: Record<string, string> = {};
  const defaultTranslation = translations.find((candidate) => candidate.locale === defaultLocale);

  if (defaultTranslation) {
    languages["x-default"] = absoluteUrl(defaultTranslation.url);
  }

  for (const translation of translations) {
    languages[translation.locale] = absoluteUrl(translation.url);
  }

  return languages;
}

export async function getPublishedContentUrls(type?: ContentType): Promise<PostRecord[]> {
  const posts = await getAllPosts();

  return posts
    .filter((post) => post.published !== false && (!type || post.contentType === type))
    .sort((a, b) => new Date(b.updated || b.date).getTime() - new Date(a.updated || a.date).getTime());
}
