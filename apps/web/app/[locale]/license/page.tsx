import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { LegalShell } from "@/components/legal/legal-shell";

interface LicensePageProps {
  params: Promise<{ locale: string }>;
}

const titleByLocale: Record<string, string> = {
  en: "License",
  es: "Licencia",
  fr: "Licence",
  it: "Licenza",
  pt: "Licenca",
};

const lastUpdated = "March 7, 2026";

export async function generateMetadata({ params }: LicensePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;
  return {
    title: `${title} | Rollerstat`,
    description: "Content usage and licensing terms for Rollerstat materials.",
  };
}

export default async function LicensePage({ params }: LicensePageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;

  return (
    <LegalShell
      title={title}
      description="This page defines how Rollerstat content may be used."
      lastUpdated={lastUpdated}
      locale={locale}
    >
      <section>
        <h2>1. Ownership</h2>
        <p>
          Unless otherwise stated, all Rollerstat editorial content, site design elements, branding, and compiled media
          presentation are owned by Rollerstat and its operator, Asadullah Khan.
        </p>
        <p>
          Rollerstat currently operates under an individual operator model. If a company entity is formed later, ownership
          and legal references on this page will be updated accordingly.
        </p>
      </section>

      <section>
        <h2>2. Default license model</h2>
        <p>
          <strong>All rights reserved.</strong>
        </p>
        <p>
          No rights are granted to reproduce, distribute, publicly display, modify, republish, or commercially exploit
          Rollerstat content except as explicitly permitted below or with prior written consent.
        </p>
      </section>

      <section>
        <h2>3. Permitted use without separate approval</h2>
        <ul>
          <li>Personal, non-commercial reading and sharing of direct links to Rollerstat pages.</li>
          <li>Short quotations with clear attribution and a source link, where legally allowed.</li>
        </ul>
      </section>

      <section>
        <h2>4. Uses that require written permission</h2>
        <ul>
          <li>Full-text reposting or substantial excerpt republishing</li>
          <li>Commercial syndication or database reuse</li>
          <li>Bulk scraping/archiving beyond standard indexing rights</li>
          <li>Use of Rollerstat logos, brand assets, or custom visuals in external branding</li>
        </ul>
      </section>

      <section>
        <h2>5. User-generated comments</h2>
        <p>
          Users retain ownership of their comments, but grant Rollerstat a non-exclusive, worldwide, royalty-free license
          to host, display, moderate, and remove that content as part of operating the service.
        </p>
      </section>

      <section>
        <h2>6. Third-party materials and trademarks</h2>
        <p>
          Certain names, logos, images, and marks may belong to their respective owners. Their inclusion does not transfer
          ownership or imply affiliation unless explicitly stated.
        </p>
      </section>

      <section>
        <h2>7. Copyright and takedown requests</h2>
        <p>
          If you believe content on Rollerstat infringes your rights, contact us with sufficient detail to investigate and
          process the request.
        </p>
        <ul>
          <li>Email-only legal contact: rollerstat@rollerstat.com</li>
          <li>Operator: Asadullah Khan</li>
        </ul>
      </section>

      <section>
        <h2>8. Reservation of rights</h2>
        <p>Any rights not expressly granted in this License page are reserved by Rollerstat.</p>
      </section>
    </LegalShell>
  );
}
