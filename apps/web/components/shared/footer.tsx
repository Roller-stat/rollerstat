"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Logo } from "./logo";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  const localizedHref = (path: string) => `/${locale}${path}`;
  const socialLinks = {
    x: "https://x.com/Rollerstat",
    instagram: "https://www.instagram.com/rollerstat.ig/",
    threads: "https://www.threads.com/@rollerstat.ig",
  } as const;
  return (
    <footer className="border-t border-white/10 bg-[var(--footer-bg)] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="md" showText={true} href={`/${locale}`} loop={true} loopDelay={2000} color="white" />
            <p className="text-sm text-white">
              {t("description")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t("quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={localizedHref("/news")} className="text-white hover:text-white/80 transition-colors">
                  {t("latestNews")}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/blogs")} className="text-white hover:text-white/80 transition-colors">
                  {t("blogPosts")}
                </Link>
              </li>
              <li>
                <Link href={localizedHref("/contact")} className="text-white hover:text-white/80 transition-colors">
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t("socialMedia")}</h3>
            <div className="flex space-x-4">
              <a
                href={socialLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.901 1.153h3.68l-8.04 9.19 9.459 12.504H16.6l-5.796-7.574-6.63 7.574H.5l8.6-9.83L0 1.153h7.588l5.243 6.932 6.07-6.932Zm-1.29 19.5h2.04L6.48 3.112H4.29l13.32 17.54Z" />
                </svg>
              </a>
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.75 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" />
                </svg>
              </a>
              <a
                href={socialLinks.threads}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-white/80 transition-colors"
                aria-label="Threads"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.3 10.7c-.1-2.7-1.6-4.2-4.3-4.2-2.8 0-4.5 1.7-4.6 4.1h2.2c.1-1.2 1-2 2.4-2 1.3 0 2.1.7 2.2 1.9-3.1.1-6 1-6 3.8 0 2 1.5 3.3 3.8 3.3 1.6 0 2.8-.6 3.5-1.8.5.8 1.3 1.3 2.4 1.3 1.8 0 3-1.2 3-3.1 0-2.2-1.5-3.2-4.6-3.3Zm-2.1 1.7c-.1 1.6-1 2.7-2.4 2.7-1 0-1.7-.5-1.7-1.3 0-1.1 1.2-1.5 4.1-1.6Zm2.2 2.5c-.3 0-.5-.1-.7-.2.1-.4.2-.8.2-1.2 1.3.1 1.9.4 1.9 1 0 .3-.2.4-.5.4Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">{t("contact")}</h3>
            <div className="space-y-2 text-sm text-white">
              <p>{t("email")}</p>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white">
          <p>{t("copyright")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href={localizedHref("/privacy")} className="hover:text-white/80 transition-colors">
              {t("privacyPolicy")}
            </Link>
            <Link href={localizedHref("/license")} className="hover:text-white/80 transition-colors">
              {t("license")}
            </Link>
            <Link href={localizedHref("/terms")} className="hover:text-white/80 transition-colors">
              {t("termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
