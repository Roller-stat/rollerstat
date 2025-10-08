import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
