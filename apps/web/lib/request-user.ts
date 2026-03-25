import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { extractBearerToken, MobileSessionUser, verifyMobileSessionToken } from '@/lib/mobile-auth';

export type RequestUser = MobileSessionUser;

export async function getRequestUser(request?: NextRequest): Promise<RequestUser | null> {
  if (request) {
    const bearer = extractBearerToken(request.headers.get('authorization'));
    if (bearer) {
      const mobileUser = verifyMobileSessionToken(bearer);
      if (mobileUser?.id) {
        return mobileUser;
      }
    }
  }

  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || null,
    name: session.user.name || null,
    image: session.user.image || null,
    role: session.user.role || 'user',
  };
}
