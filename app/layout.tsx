import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import { headers } from "next/headers";
import { getLocaleFromPathname, defaultLocale } from "@/lib/i18n";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Rollerstat - Your Source for Roller Hockey News",
    template: "%s | Rollerstat",
  },
  description: "Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const locale = pathname ? getLocaleFromPathname(pathname) : defaultLocale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${barlowCondensed.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
