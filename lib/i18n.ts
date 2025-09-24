export const locales = ["en", "es", "fr", "de", "it"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/");
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return defaultLocale;
}

export function getLocalizedPath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  
  // If the first segment is already a locale, replace it
  if (segments[1] && isValidLocale(segments[1])) {
    segments[1] = locale;
  } else {
    // If no locale in path, add it
    segments.splice(1, 0, locale);
  }
  
  return segments.join("/");
}

export function removeLocaleFromPath(pathname: string): string {
  const segments = pathname.split("/");
  
  if (segments[1] && isValidLocale(segments[1])) {
    segments.splice(1, 1);
  }
  
  return segments.join("/");
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
};
