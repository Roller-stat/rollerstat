import type { Metadata } from "next";
import { Barlow_Condensed, Allura } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WebSessionProvider } from "@/components/auth/web-session-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const allura = Allura({
  variable: "--font-allura",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: {
    default: "Rollerstat - Your Source for Roller Hockey News",
    template: "%s | Rollerstat",
  },
  description: "Stay updated with the latest news, insights, and stories from the world of roller hockey across Europe.",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${barlowCondensed.variable} ${allura.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WebSessionProvider>
            {children}
            <Toaster />
          </WebSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
