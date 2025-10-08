import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, isValidLocale } from "@/lib/i18n";
import type { Metadata } from "next";

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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (value as string) || key;
  };

  return {
    title: t("seo.title"),
    description: t("seo.description"),
    openGraph: {
      title: t("seo.ogTitle"),
      description: t("seo.ogDescription"),
      type: "website",
      locale: getOpenGraphLocale(locale),
      siteName: "Rollerstat",
      images: [
        {
          url: "https://rollerstat.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Rollerstat - Your Source for Roller Hockey News",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.twitterTitle"),
      description: t("seo.twitterDescription"),
    },
    alternates: {
      canonical: `https://rollerstat.com/${locale}`,
      languages: {
        'en': 'https://rollerstat.com/en',
        'es': 'https://rollerstat.com/es',
        'fr': 'https://rollerstat.com/fr',
        'it': 'https://rollerstat.com/it',
        'pt': 'https://rollerstat.com/pt',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
