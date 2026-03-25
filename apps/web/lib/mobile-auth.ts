import crypto from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/db/client';

export type MobileSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
};

type MobileSessionPayload = {
  sub: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
  iat: number;
  exp: number;
  iss: 'rollerstat-mobile';
};

type GoogleTokenInfo = {
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  aud?: string;
};

const MOBILE_TOKEN_ISSUER = 'rollerstat-mobile';
const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = padded.length % 4;
  const withPadding = remainder === 0 ? padded : `${padded}${'='.repeat(4 - remainder)}`;
  return Buffer.from(withPadding, 'base64').toString('utf8');
}

function resolveMobileAuthSecret(): string {
  const secret =
    process.env.MOBILE_AUTH_SECRET ||
    process.env.WEB_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;

  if (!secret || !secret.trim()) {
    throw new Error('Mobile auth secret is not configured. Set MOBILE_AUTH_SECRET (or NEXTAUTH_SECRET).');
  }

  return secret.trim();
}

function resolveAllowedGoogleAudiences(): string[] {
  const values = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.MOBILE_GOOGLE_CLIENT_ID,
    process.env.MOBILE_GOOGLE_ANDROID_CLIENT_ID,
    process.env.MOBILE_GOOGLE_WEB_CLIENT_ID,
    ...(process.env.MOBILE_GOOGLE_CLIENT_IDS?.split(',') || []),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return [...new Set(values)];
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(data).digest());
}

export function createMobileSessionToken(user: MobileSessionUser, ttlSeconds = MOBILE_TOKEN_TTL_SECONDS): string {
  const secret = resolveMobileAuthSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload: MobileSessionPayload = {
    sub: user.id,
    email: user.email || null,
    name: user.name || null,
    image: user.image || null,
    role: user.role || 'user',
    iat: now,
    exp: now + ttlSeconds,
    iss: MOBILE_TOKEN_ISSUER,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(signingInput, secret);

  return `${signingInput}.${signature}`;
}

export function verifyMobileSessionToken(token: string): MobileSessionUser | null {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const secret = resolveMobileAuthSecret();
    const expected = sign(signingInput, secret);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as MobileSessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (payload.iss !== MOBILE_TOKEN_ISSUER) {
      return null;
    }

    if (!payload.sub || payload.exp <= now) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email || null,
      name: payload.name || null,
      image: payload.image || null,
      role: payload.role || 'user',
    };
  } catch {
    return null;
  }
}

export async function verifyGoogleIdToken(idToken: string): Promise<MobileSessionUser> {
  const normalized = idToken.trim();
  if (!normalized) {
    throw new Error('Missing Google ID token.');
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(normalized)}`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Google ID token verification failed.');
  }

  const payload = (await response.json()) as GoogleTokenInfo;
  const allowedAudiences = resolveAllowedGoogleAudiences();

  if (!payload.sub || !payload.email) {
    throw new Error('Google profile is incomplete.');
  }

  if (payload.email_verified !== 'true') {
    throw new Error('Google email is not verified.');
  }

  if (allowedAudiences.length > 0 && (!payload.aud || !allowedAudiences.includes(payload.aud))) {
    throw new Error('Google token audience is not allowed.');
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    image: payload.picture || null,
    role: 'user',
  };
}

export async function upsertAppUser(user: MobileSessionUser): Promise<MobileSessionUser> {
  const client = getSupabaseServerClient();
  if (!client) {
    return user;
  }

  const normalizedEmail = user.email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required for mobile accounts.');
  }

  const upsertPayload = {
    id: user.id,
    email: normalizedEmail,
    name: user.name || 'User',
    image: user.image || null,
    role: user.role || 'user',
  };

  const { error } = await client.from('app_users').upsert(
    {
      ...upsertPayload,
    },
    { onConflict: 'id' },
  );

  if (!error) {
    return {
      ...user,
      id: upsertPayload.id,
      email: normalizedEmail,
      role: user.role || 'user',
    };
  }

  const isDuplicateEmail =
    error.code === '23505' &&
    typeof error.message === 'string' &&
    error.message.includes('app_users_email_key');

  if (!isDuplicateEmail) {
    throw new Error('Failed to persist mobile user profile.');
  }

  const { data: existingByEmail, error: existingByEmailError } = await client
    .from('app_users')
    .select('id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingByEmailError || !existingByEmail?.id) {
    throw new Error('Failed to resolve existing mobile user profile.');
  }

  await client
    .from('app_users')
    .update({
      name: user.name || 'User',
      image: user.image || null,
    })
    .eq('id', existingByEmail.id);

  return {
    ...user,
    id: existingByEmail.id,
    email: normalizedEmail,
    role: existingByEmail.role || user.role || 'user',
  };
}

export function extractBearerToken(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = trimmed.slice('bearer '.length).trim();
  return token || null;
}
