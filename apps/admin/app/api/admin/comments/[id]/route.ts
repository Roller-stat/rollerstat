import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';

const VALID_STATUSES = new Set(['visible', 'hidden', 'deleted']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || '').trim();

  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const updatePayload =
    status === 'deleted'
      ? { status: 'deleted', body: '[deleted]' }
      : { status };

  const { data, error } = await client
    .from('comments')
    .update(updatePayload)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error updating comment status:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
