import { NextRequest, NextResponse } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  'error-codes'?: string[];
};

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_RATE_LIMIT_MESSAGE = 'Too many requests. Please try again later.';

let lastRateLimitCleanup = 0;

function cleanupExpiredRateLimitBuckets(now: number) {
  if (now - lastRateLimitCleanup < RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of RATE_LIMIT_BUCKETS.entries()) {
    if (bucket.resetAt <= now) {
      RATE_LIMIT_BUCKETS.delete(key);
    }
  }

  lastRateLimitCleanup = now;
}

function normalizeIp(ip: string): string {
  return ip.replace(/^::ffff:/, '').trim();
}

function parseForwardedFor(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const firstIp = value
    .split(',')
    .map((entry) => entry.trim())
    .find(Boolean);

  return firstIp ? normalizeIp(firstIp) : null;
}

export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return normalizeIp(cfIp);
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return normalizeIp(xRealIp);
  }

  const forwarded = parseForwardedFor(request.headers.get('x-forwarded-for'));
  if (forwarded) {
    return forwarded;
  }

  return 'unknown';
}

export function checkRateLimit(rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  cleanupExpiredRateLimitBuckets(now);

  const existing = RATE_LIMIT_BUCKETS.get(rule.key);
  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(rule.key, {
      count: 1,
      resetAt: now + rule.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(rule.windowMs / 1000),
    };
  }

  if (existing.count >= rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  RATE_LIMIT_BUCKETS.set(rule.key, existing);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function enforceRateLimits(rules: RateLimitRule[]): RateLimitResult {
  for (const rule of rules) {
    const result = checkRateLimit(rule);
    if (!result.allowed) {
      return result;
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function createRateLimitResponse(
  retryAfterSeconds: number,
  message: string = DEFAULT_RATE_LIMIT_MESSAGE,
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 429 },
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  return response;
}

function shouldEnforceCaptcha(): boolean {
  if (process.env.CAPTCHA_ENFORCE === 'false') {
    return false;
  }

  if (process.env.CAPTCHA_ENFORCE === 'true') {
    return true;
  }

  return process.env.NODE_ENV === 'production';
}

export async function verifyTurnstileCaptcha(params: {
  request: NextRequest;
  token: string | null | undefined;
  action?: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const enforceCaptcha = shouldEnforceCaptcha();

  if (!enforceCaptcha) {
    return { ok: true };
  }

  if (!secret) {
    return {
      ok: false,
      status: 503,
      error: 'Captcha is not configured.',
    };
  }

  const token = params.token?.trim();
  if (!token) {
    return {
      ok: false,
      status: 400,
      error: 'Captcha verification is required.',
    };
  }

  const formData = new URLSearchParams();
  formData.set('secret', secret);
  formData.set('response', token);

  const clientIp = getClientIp(params.request);
  if (clientIp !== 'unknown') {
    formData.set('remoteip', clientIp);
  }

  try {
    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      cache: 'no-store',
    });

    if (!verifyResponse.ok) {
      return {
        ok: false,
        status: 503,
        error: 'Captcha verification failed.',
      };
    }

    const payload = (await verifyResponse.json()) as TurnstileResponse;
    if (!payload.success) {
      return {
        ok: false,
        status: 403,
        error: 'Captcha verification failed.',
      };
    }

    if (params.action && payload.action && payload.action !== params.action) {
      return {
        ok: false,
        status: 403,
        error: 'Captcha verification failed.',
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 503,
      error: 'Captcha verification failed.',
    };
  }
}

export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 1) {
    return '***';
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex);
  return `${localPart.slice(0, 2)}***${domain}`;
}
