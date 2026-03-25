import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/request-user';

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user,
  });
}
