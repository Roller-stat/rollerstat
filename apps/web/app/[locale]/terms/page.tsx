import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { LegalShell } from "@/components/legal/legal-shell";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

const titleByLocale: Record<string, string> = {
  en: "Terms of Service",
  es: "Terminos de Servicio",
  fr: "Conditions d Utilisation",
  it: "Termini di Servizio",
  pt: "Termos de Servico",
};

const lastUpdated = "March 7, 2026";

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;
  return {
    title: `${title} | Rollerstat`,
    description: "Terms governing access and use of Rollerstat services and content.",
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;

  return (
    <LegalShell
      title={title}
      description="These Terms govern your use of Rollerstat, including account, comments, reactions, and content usage."
      lastUpdated={lastUpdated}
      locale={locale}
    >
      <section>
        <h2>0. Current legal entity status</h2>
        <p>
          Rollerstat is currently operated by <strong>Asadullah Khan</strong> as an individual operator. If a company
          is formed later, these Terms will be updated to reflect the new legal entity.
        </p>
      </section>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Rollerstat, you agree to these Terms of Service and our Privacy Policy. If you do not agree,
          you must not use the service.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 16 years old to use account-based interaction features (including commenting). By using these
          features, you represent that you meet this requirement.
        </p>
      </section>

      <section>
        <h2>3. Accounts and authentication</h2>
        <ul>
          <li>Commenting currently requires Google sign-in.</li>
          <li>You are responsible for activity under your account session.</li>
          <li>You must not attempt to bypass authentication or moderation controls.</li>
        </ul>
      </section>

      <section>
        <h2>4. User content (comments)</h2>
        <ul>
          <li>You retain ownership of comments you post.</li>
          <li>
            By posting, you grant Rollerstat a non-exclusive, worldwide, royalty-free license to host, display, and moderate
            that content in connection with operating the service.
          </li>
          <li>You are responsible for ensuring your comment content is lawful and does not infringe third-party rights.</li>
        </ul>
      </section>

      <section>
        <h2>5. Moderation and enforcement</h2>
        <p>We may moderate, hide, remove, or restrict content/accounts that violate these Terms, including for:</p>
        <ul>
          <li>Abuse, harassment, hate speech, or threats</li>
          <li>Spam, deceptive behavior, or repeated low-quality promotional content</li>
          <li>Illegal content or rights-infringing material</li>
          <li>Attempts to disrupt system integrity or evade limits</li>
        </ul>
      </section>

      <section>
        <h2>6. Prohibited conduct</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use bots/scrapers in violation of applicable law or service protections</li>
          <li>Attempt unauthorized access to infrastructure, data, or admin features</li>
          <li>Misrepresent identity or impersonate others</li>
          <li>Post malicious code or interfere with platform operations</li>
        </ul>
      </section>

      <section>
        <h2>7. Intellectual property</h2>
        <p>
          Except for user-generated comments and third-party materials, Rollerstat content and branding are owned by
          Rollerstat and protected by applicable IP laws. Use rights are described in the License page.
        </p>
      </section>

      <section>
        <h2>8. Third-party services</h2>
        <p>
          Rollerstat relies on third-party providers (for example Google sign-in, Supabase, Brevo, Cloudinary, and hosting
          infrastructure). Service availability may depend on those providers.
        </p>
      </section>

      <section>
        <h2>9. Newsletter and communications</h2>
        <ul>
          <li>Newsletter subscription is opt-in.</li>
          <li>You can unsubscribe through provided unsubscribe mechanisms.</li>
          <li>Operational or legal notices may still be sent where required.</li>
        </ul>
      </section>

      <section>
        <h2>10. Service availability and disclaimers</h2>
        <p>
          Rollerstat is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not guarantee uninterrupted or
          error-free operation at all times.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Rollerstat and its operator are not liable for indirect, incidental, special,
          consequential, or punitive damages, or for loss of profits/data resulting from use of the service.
        </p>
      </section>

      <section>
        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Rollerstat and its operator from claims, liabilities, and expenses arising
          from your misuse of the service or your violation of these Terms.
        </p>
      </section>

      <section>
        <h2>13. Termination</h2>
        <p>
          We may suspend or terminate access to features, accounts, or content where necessary for legal, security, or policy
          enforcement reasons.
        </p>
      </section>

      <section>
        <h2>14. Governing law and venue</h2>
        <p>
          These Terms are governed by the laws of the State of Kansas, USA. Subject to applicable mandatory law, any
          dispute arising out of or relating to these Terms or the service shall be brought in the state or federal courts
          located in or serving Lawrence, Kansas, USA.
        </p>
      </section>

      <section>
        <h2>15. Changes to Terms</h2>
        <p>
          We may update these Terms periodically. Continued use after updates constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>16. Contact</h2>
        <ul>
          <li>Email-only legal contact: rollerstat@rollerstat.com</li>
          <li>Operator: Asadullah Khan</li>
        </ul>
      </section>
    </LegalShell>
  );
}
