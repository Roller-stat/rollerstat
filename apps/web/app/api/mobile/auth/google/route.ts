import { NextRequest, NextResponse } from 'next/server';
import {
  createMobileSessionToken,
  upsertAppUser,
  verifyGoogleIdToken,
} from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required.' }, { status: 400 });
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    const appUser = await upsertAppUser(googleUser);
    const token = createMobileSessionToken(appUser);

    return NextResponse.json({
      success: true,
      token,
      user: appUser,
      expiresIn: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mobile sign-in failed.';
    const status =
      message.includes('token') || message.includes('Google') || message.includes('Email')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
