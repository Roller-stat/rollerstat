import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n";
import { LegalShell } from "@/components/legal/legal-shell";

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

const titleByLocale: Record<string, string> = {
  en: "Privacy Policy",
  es: "Politica de Privacidad",
  fr: "Politique de Confidentialite",
  it: "Informativa sulla Privacy",
  pt: "Politica de Privacidade",
};

const lastUpdated = "March 7, 2026";

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;

  return {
    title: `${title} | Rollerstat`,
    description: "How Rollerstat collects, uses, stores, and protects personal data.",
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const title = titleByLocale[locale] || titleByLocale.en;

  return (
    <LegalShell
      title={title}
      description="This policy explains what personal data Rollerstat processes and how it is handled."
      lastUpdated={lastUpdated}
      locale={locale}
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          Rollerstat is operated by <strong>Asadullah Khan</strong> (individual operator). In this policy,
          &quot;Rollerstat&quot;, &quot;we&quot;, &quot;our&quot;, and &quot;us&quot; refer to this operator and website.
        </p>
        <p>
          Rollerstat currently operates as an individual-run service. If and when a company is incorporated
          later, this policy will be updated to reflect the new legal entity details.
        </p>
        <ul>
          <li>Controller/Owner: Asadullah Khan</li>
          <li>Public contact (email-only): rollerstat@rollerstat.com</li>
          <li>Website: rollerstat.com</li>
        </ul>
      </section>

      <section>
        <h2>2. Scope</h2>
        <p>
          This policy applies to the public Rollerstat website, newsletter subscription flows, comment/reaction
          features, and related admin moderation operations.
        </p>
      </section>

      <section>
        <h2>3. Data we collect</h2>
        <h3>3.1 Account and sign-in data (Google sign-in)</h3>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Profile image (if provided by your Google account)</li>
          <li>Technical identifiers needed for session/auth handling</li>
        </ul>

        <h3>3.2 Comment and interaction data</h3>
        <ul>
          <li>Comment text, timestamps, moderation status</li>
          <li>Reaction choice and aggregated reaction counts</li>
          <li>Device-derived pseudonymous identifier/hash for reaction controls</li>
        </ul>

        <h3>3.3 Newsletter data</h3>
        <ul>
          <li>Email address</li>
          <li>Optional first/last name</li>
          <li>Locale preference and subscription lifecycle metadata</li>
        </ul>

        <h3>3.4 Contact form data</h3>
        <ul>
          <li>Name</li>
          <li>Email address</li>
          <li>Message content</li>
        </ul>

        <h3>3.5 Technical and security data</h3>
        <ul>
          <li>Server logs and basic request metadata needed for security/operations</li>
          <li>Session/cookie values required for login and feature integrity</li>
        </ul>
      </section>

      <section>
        <h2>4. Why we process data</h2>
        <ul>
          <li>To authenticate users and maintain secure sessions</li>
          <li>To publish and moderate comments and reactions</li>
          <li>To run newsletter subscribe/unsubscribe flows</li>
          <li>To answer contact form submissions</li>
          <li>To operate, secure, and improve service reliability</li>
          <li>To comply with legal obligations (for example unsubscribe compliance records)</li>
        </ul>
      </section>

      <section>
        <h2>5. Legal bases (GDPR)</h2>
        <ul>
          <li>Performance of a contract/service request (account/session and requested features)</li>
          <li>Consent (newsletter subscriptions and similar opt-ins)</li>
          <li>Legitimate interests (security, abuse prevention, product operation)</li>
          <li>Legal obligation (where required by law)</li>
        </ul>
      </section>

      <section>
        <h2>6. Processors and recipients</h2>
        <p>We use third-party providers to operate the service. These may process data on our behalf:</p>
        <ul>
          <li>Supabase (database and backend services)</li>
          <li>Google OAuth/Auth services (user sign-in)</li>
          <li>Brevo (newsletter and transactional email workflows)</li>
          <li>Cloudinary (media hosting/processing)</li>
          <li>Hosting/infrastructure provider(s) used to serve the apps</li>
        </ul>
      </section>

      <section>
        <h2>7. International transfers</h2>
        <p>
          Data may be processed in countries other than your own, including the United States and other regions where
          our providers operate infrastructure. Where applicable, we rely on provider contractual safeguards for cross-border
          processing.
        </p>
      </section>

      <section>
        <h2>8. Data retention</h2>
        <p>Retention windows currently used by policy:</p>
        <ul>
          <li>Comments: retained until user/admin deletion or moderation action; records marked deleted are purged within 30 days.</li>
          <li>User profile/auth linkage records: retained while account is active, then up to 30 days after deletion flow.</li>
          <li>Reaction/device hash records: retained up to 12 months on a rolling basis.</li>
          <li>Contact form submissions: retained up to 12 months for support/operations.</li>
          <li>Newsletter records: retained until unsubscribe and compliance lifecycle handling.</li>
          <li>Backups: disaster-recovery snapshots may retain deleted records for up to 90 days before purge.</li>
        </ul>
        <p>
          Backup retention does not mean public display. It only means historical encrypted backup copies may continue
          to exist for recovery for a limited period.
        </p>
      </section>

      <section>
        <h2>9. Your rights</h2>
        <p>Depending on your jurisdiction, you may have rights to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Delete data (subject to legal/operational limits)</li>
          <li>Object to or restrict specific processing</li>
          <li>Withdraw consent for consent-based processing</li>
          <li>Lodge a complaint with your local supervisory authority</li>
        </ul>
        <p>To submit a request, contact rollerstat@rollerstat.com.</p>
      </section>

      <section>
        <h2>10. Cookies and similar technologies</h2>
        <p>
          Rollerstat currently uses essential cookies/storage for session/auth behavior and feature integrity
          (for example comment/reaction state and login sessions). We do not currently run ad-tech profiling
          on these legal pages.
        </p>
        <p>
          If non-essential analytics or marketing trackers are introduced later, this policy and user controls
          will be updated accordingly.
        </p>
      </section>

      <section>
        <h2>11. Security</h2>
        <p>
          We apply reasonable technical and organizational measures to protect data from unauthorized access,
          loss, misuse, or alteration. No internet system is perfectly secure, and absolute security cannot be guaranteed.
        </p>
      </section>

      <section>
        <h2>12. Children</h2>
        <p>Rollerstat is not intended for users under 16 years of age.</p>
      </section>

      <section>
        <h2>13. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Updates are posted on this page with a revised
          &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2>14. EU representation notice</h2>
        <p>
          Under GDPR Article 27, Rollerstat&apos;s EU representative is:
        </p>
        <ul>
          <li>Name: Naved Ahmad</li>
          <li>Address: 3 Rue de Gorges, 44000 Nantes, France</li>
          <li>Email: navedmoin67@gmail.com</li>
          <li>
            Phone: <a href="tel:+33642355758">+33 6 42 35 57 58</a>
          </li>
        </ul>
      </section>

      <section>
        <h2>15. Contact</h2>
        <ul>
          <li>Email-only legal contact: rollerstat@rollerstat.com</li>
          <li>Operator: Asadullah Khan</li>
        </ul>
      </section>
    </LegalShell>
  );
}
