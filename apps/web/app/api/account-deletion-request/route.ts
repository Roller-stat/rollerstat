import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';
import {
  createRateLimitResponse,
  enforceRateLimits,
  getClientIp,
} from '@/lib/request-guards';

function isMissingContactTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) {
    return false;
  }

  return (
    error.code === 'PGRST205' ||
    (error.code === '42P01' &&
      typeof error.message === 'string' &&
      error.message.includes('contact_submissions'))
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = enforceRateLimits([
    { key: `account-delete:minute:${ip}`, limit: 2, windowMs: 60_000 },
    { key: `account-delete:daily:${ip}`, limit: 15, windowMs: 24 * 60 * 60 * 1000 },
  ]);

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const reasonRaw = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const reason = reasonRaw.slice(0, 1000);
    const message = reason
      ? `Account deletion requested. Reason: ${reason}`
      : 'Account deletion requested.';

    if (isDatabaseConfigured()) {
      const client = getSupabaseServerClient();
      if (client) {
        const { error } = await client.from('contact_submissions').insert({
          name: 'Account Deletion Request',
          email,
          message,
          locale: null,
          source: 'account_deletion_request',
        });

        if (error && !isMissingContactTableError(error)) {
          return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
