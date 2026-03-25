import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/db/client';
import { getRequestUser } from '@/lib/request-user';

function resolveUserReactionHash(userId: string): string | null {
  const salt = process.env.REACTION_DEVICE_SALT?.trim();
  if (!salt) {
    return null;
  }
  return crypto.createHash('sha256').update(`user:${userId}:${salt}`).digest('hex');
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured.' }, { status: 500 });
  }

  const normalizedEmail = user.email?.trim().toLowerCase() || null;

  const reactionHash = resolveUserReactionHash(user.id);
  if (reactionHash) {
    await client.from('reactions').delete().eq('device_hash', reactionHash);
  }

  const { data: existingById } = await client
    .from('app_users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingById?.id) {
    const { error: deleteByIdError } = await client.from('app_users').delete().eq('id', existingById.id);
    if (deleteByIdError) {
      return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: true });
  }

  if (normalizedEmail) {
    const { data: existingByEmail } = await client
      .from('app_users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingByEmail?.id) {
      const { error: deleteByEmailError } = await client
        .from('app_users')
        .delete()
        .eq('id', existingByEmail.id);
      if (deleteByEmailError) {
        return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }
  }

  return NextResponse.json({
    success: true,
    deleted: false,
    message: 'No matching account record was found.',
  });
}
