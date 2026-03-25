import Link from 'next/link';
import { AccountDeleteRequestForm } from './account-delete-request-form';

export const dynamic = 'force-dynamic';

export default function AccountDeletePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Delete Your RollerStat Account</h1>
        <p className="mt-3 text-muted-foreground">
          If you signed in with Google and want your RollerStat account and related comments removed,
          you can request deletion from this page.
        </p>

        <div className="mt-8 rounded-none border p-6">
          <h2 className="text-lg font-semibold">Submit Account Deletion Request</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the same email address you use for RollerStat sign-in.
          </p>
          <div className="mt-6">
            <AccountDeleteRequestForm />
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm text-muted-foreground">
          <p>For authenticated mobile users, in-app deletion is available in Settings.</p>
          <p>
            Privacy policy:{' '}
            <Link href="/en/privacy" className="underline underline-offset-4">
              rollerstat.com/en/privacy
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
