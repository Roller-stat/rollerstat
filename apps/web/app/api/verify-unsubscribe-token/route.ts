import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-tokens';
import { createRateLimitResponse, enforceRateLimits, getClientIp } from '@/lib/request-guards';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = enforceRateLimits([
    { key: `verify-unsubscribe-token:minute:${ip}`, limit: 20, windowMs: 60_000 },
  ]);

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token on the server side
    const result = await verifyUnsubscribeToken(token);

    return NextResponse.json(result);
  } catch {
    console.error('Token verification API error');
    return NextResponse.json(
      { valid: false, error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
