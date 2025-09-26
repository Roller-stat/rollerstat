import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";
import { locales, isValidLocale, defaultLocale } from "@/lib/i18n";
import "../globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const t = (key: string) => {
    const keys = key.split(".");
    let value: unknown = messages;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value || key;
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  return {
    title: t("seo.title"),
    description: t("seo.description"),
    keywords: t("seo.keywords"),
    alternates: {
      languages: {
        ...locales.reduce((acc, loc) => {
          acc[loc] = `${baseUrl}/${loc}`;
          return acc;
        }, {} as Record<string, string>),
        'x-default': `${baseUrl}/${defaultLocale}`,
      },
    },
    openGraph: {
      title: t("seo.ogTitle"),
      description: t("seo.ogDescription"),
      locale: locale,
      alternateLocale: locales.filter(loc => loc !== locale),
      url: `${baseUrl}/${locale}`,
      siteName: "Rollerstat",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("seo.twitterTitle"),
      description: t("seo.twitterDescription"),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
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
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${barlowCondensed.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
