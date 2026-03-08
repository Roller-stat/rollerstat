import { ReactNode } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

interface LegalShellProps {
  title: string;
  description: string;
  lastUpdated: string;
  locale: string;
  children: ReactNode;
}

export function LegalShell({ title, description, lastUpdated, locale, children }: LegalShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none"
          style={{ backgroundImage: "url(/HeroBG.png)" }}
        />
        <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-14 relative z-10">
          <div className="max-w-4xl mx-auto rounded-xl border border-border bg-card/90 backdrop-blur p-6 sm:p-8 md:p-10">
            <header className="space-y-2">
              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-bold"
                style={{ fontFamily: '"Castoro Titling", serif' }}
              >
                {title}
              </h1>
              <p className="text-muted-foreground">{description}</p>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
              {locale !== "en" ? (
                <p className="text-sm rounded-md border border-border bg-muted/40 p-3">
                  This legal page is currently published in English for legal consistency. In case of any conflict,
                  the English version controls.
                </p>
              ) : null}
            </header>

            <article className="mdx-content mt-8 space-y-8">{children}</article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
