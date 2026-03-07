import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db/client';

type AppUserEmailRelation =
  | { email?: string | null }
  | Array<{ email?: string | null }>
  | null
  | undefined;

function extractOwnerEmail(relation: AppUserEmailRelation): string | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0]?.email || null;
  }

  return relation.email || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const nextBody = String(body.body || '').trim();

  if (!nextBody || nextBody.length < 2 || nextBody.length > 2000) {
    return NextResponse.json({ error: 'Comment must be between 2 and 2000 characters' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const { data: existing, error: existingError } = await client
    .from('comments')
    .select('id, user_id, status, app_users(email)')
    .eq('id', id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const commentOwnerEmail = extractOwnerEmail(existing.app_users as AppUserEmailRelation);
  const isOwnerById = existing.user_id === session.user.id;
  const isOwnerByEmail =
    Boolean(session.user.email) &&
    Boolean(commentOwnerEmail) &&
    String(session.user.email).toLowerCase() === String(commentOwnerEmail).toLowerCase();

  if (!isOwnerById && !isOwnerByEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (existing.status === 'deleted') {
    return NextResponse.json({ error: 'Deleted comments cannot be edited' }, { status: 400 });
  }

  const { error } = await client
    .from('comments')
    .update({ body: nextBody })
    .eq('id', id);

  if (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const { data: existing, error: existingError } = await client
    .from('comments')
    .select('id, user_id, app_users(email)')
    .eq('id', id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const commentOwnerEmail = extractOwnerEmail(existing.app_users as AppUserEmailRelation);
  const isOwnerById = existing.user_id === session.user.id;
  const isOwnerByEmail =
    Boolean(session.user.email) &&
    Boolean(commentOwnerEmail) &&
    String(session.user.email).toLowerCase() === String(commentOwnerEmail).toLowerCase();

  if (!isOwnerById && !isOwnerByEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await client
    .from('comments')
    .update({ status: 'deleted', body: '[deleted]' })
    .eq('id', id);

  if (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
