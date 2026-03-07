import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';

function constantTimeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function extractProvidedSecret(request: NextRequest): string | null {
  const headerSecret = request.headers.get('x-retention-secret');
  if (headerSecret) {
    return headerSecret;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return null;
}

function isAuthorized(request: NextRequest): { ok: boolean; reason?: string } {
  const expectedSecret = process.env.RETENTION_CRON_SECRET;
  if (!expectedSecret) {
    return {
      ok: false,
      reason: 'RETENTION_CRON_SECRET is not configured',
    };
  }

  const providedSecret = extractProvidedSecret(request);
  if (!providedSecret) {
    return {
      ok: false,
      reason: 'Missing retention secret',
    };
  }

  if (!constantTimeEqual(providedSecret, expectedSecret)) {
    return {
      ok: false,
      reason: 'Invalid retention secret',
    };
  }

  return { ok: true };
}

function parseInvokedBy(value: unknown): string {
  if (typeof value !== 'string') {
    return 'api_manual';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return 'api_manual';
  }

  return trimmed.slice(0, 120);
}

export async function GET(request: NextRequest) {
  const authCheck = isAuthorized(request);
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.reason }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ok',
    endpoint: 'retention-maintenance',
    databaseConfigured: isDatabaseConfigured(),
    hasSecret: Boolean(process.env.RETENTION_CRON_SECRET),
  });
}

export async function POST(request: NextRequest) {
  const authCheck = isAuthorized(request);
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.reason }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 503 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 503 });
  }

  let invokedBy = 'api_manual';
  try {
    const body = await request.json().catch(() => ({}));
    invokedBy = parseInvokedBy((body as { invokedBy?: unknown }).invokedBy);
  } catch {
    invokedBy = 'api_manual';
  }

  const { data, error } = await client.rpc('run_retention_cleanup', {
    p_invoked_by: invokedBy,
  });

  if (error) {
    const message = String(error.message || '');
    const isMissingFunction =
      error.code === 'PGRST202' ||
      error.code === '42883' ||
      message.includes('run_retention_cleanup');

    if (isMissingFunction) {
      return NextResponse.json(
        {
          error:
            'Retention function is missing. Run packages/db/migrations/20260307_retention_automation.sql in Supabase.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: error.message || 'Retention cleanup failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    result: data,
  });
}
