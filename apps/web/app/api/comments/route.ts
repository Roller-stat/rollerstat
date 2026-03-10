import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/db/client';

type CommentUserRelation = {
  name?: string | null;
  image?: string | null;
  email?: string | null;
};

type CommentSortOrder = 'asc' | 'desc';

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveCommentUser(
  relation: CommentUserRelation | CommentUserRelation[] | null | undefined,
): CommentUserRelation | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] || null;
  }

  return relation;
}

function mapCommentRow(row: {
  id: string;
  post_id: string;
  post_localization_id: string;
  user_id: string;
  body: string;
  status: string;
  created_at: string;
  updated_at: string;
  app_users?: CommentUserRelation | CommentUserRelation[] | null;
}) {
  const user = resolveCommentUser(row.app_users);

  return {
    id: row.id,
    postId: row.post_id,
    postLocalizationId: row.post_localization_id,
    userId: row.user_id,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      name: user?.name || 'User',
      image: user?.image || null,
      email: user?.email || null,
    },
  };
}

async function resolvePostScope(
  client: ReturnType<typeof getSupabaseServerClient>,
  postIdInput: string | null,
  postLocalizationIdInput: string | null,
) {
  if (!client) {
    return null;
  }

  let postId = postIdInput;
  let postLocalizationId = postLocalizationIdInput;

  if (postLocalizationId) {
    const { data: localizationRow, error: localizationError } = await client
      .from('post_localizations')
      .select('id, post_id')
      .eq('id', postLocalizationId)
      .maybeSingle();

    if (localizationError || !localizationRow) {
      return null;
    }

    if (postId && localizationRow.post_id !== postId) {
      return null;
    }

    postId = localizationRow.post_id;
    postLocalizationId = localizationRow.id;
  }

  if (!postId) {
    return null;
  }

  if (!postLocalizationId) {
    const { data: fallbackLocalization } = await client
      .from('post_localizations')
      .select('id')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!fallbackLocalization) {
      return null;
    }

    postLocalizationId = fallbackLocalization.id;
  }

  return {
    postId,
    postLocalizationId,
  };
}

async function ensureAppUser(
  client: ReturnType<typeof getSupabaseServerClient>,
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
  },
) {
  if (!client) {
    return user.id;
  }

  const normalizedEmail = user.email?.trim().toLowerCase();
  const upsertPayload = {
    id: user.id,
    email: normalizedEmail || `${user.id}@unknown.local`,
    name: user.name || 'User',
    image: user.image || null,
    role: user.role || 'user',
  };

  const { error: userError } = await client.from('app_users').upsert(upsertPayload, {
    onConflict: 'id',
  });

  if (!userError) {
    return user.id;
  }

  const isDuplicateEmail =
    userError.code === '23505' &&
    typeof userError.message === 'string' &&
    userError.message.includes('app_users_email_key') &&
    Boolean(normalizedEmail);

  if (!isDuplicateEmail) {
    throw userError;
  }

  const { data: existingByEmail, error: existingByEmailError } = await client
    .from('app_users')
    .select('id')
    .eq('email', normalizedEmail as string)
    .maybeSingle();

  if (existingByEmailError || !existingByEmail) {
    throw userError;
  }

  await client
    .from('app_users')
    .update({
      name: user.name || 'User',
      image: user.image || null,
    })
    .eq('id', existingByEmail.id);

  return existingByEmail.id;
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('postId');
  const postLocalizationId = request.nextUrl.searchParams.get('postLocalizationId');
  const requestedPage = parsePositiveInt(request.nextUrl.searchParams.get('page'), 1);
  const pageSize = clamp(parsePositiveInt(request.nextUrl.searchParams.get('pageSize'), 20), 1, 50);
  const sortOrderParam = request.nextUrl.searchParams.get('sortOrder');
  const sortOrder: CommentSortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';

  if (!postId && !postLocalizationId) {
    return NextResponse.json({ error: 'postId or postLocalizationId is required' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({
      comments: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      hasMore: false,
      sortOrder,
    });
  }

  const scope = await resolvePostScope(client, postId, postLocalizationId);
  if (!scope) {
    return NextResponse.json({
      comments: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      hasMore: false,
      sortOrder,
    });
  }

  const page = Math.max(1, requestedPage);
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await client
    .from('comments')
    .select(
      'id, post_id, post_localization_id, user_id, body, status, created_at, updated_at, app_users(name, image, email)',
      { count: 'exact' },
    )
    .eq('post_id', scope.postId)
    .in('status', ['visible'])
    .order('created_at', { ascending: sortOrder === 'asc' })
    .range(start, end);

  if (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  const normalizedTotal = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(normalizedTotal / pageSize));

  return NextResponse.json({
    comments: (data || []).map((row) => mapCommentRow(row)),
    total: normalizedTotal,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
    sortOrder,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const postId = String(body.postId || '').trim();
  const postLocalizationId = String(body.postLocalizationId || '').trim();
  const commentBody = String(body.body || '').trim();

  if ((!postId && !postLocalizationId) || !commentBody) {
    return NextResponse.json({ error: 'postId or postLocalizationId and body are required' }, { status: 400 });
  }

  if (commentBody.length < 2 || commentBody.length > 2000) {
    return NextResponse.json({ error: 'Comment must be between 2 and 2000 characters' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const scope = await resolvePostScope(
    client,
    postId || null,
    postLocalizationId || null,
  );

  if (!scope) {
    return NextResponse.json({ error: 'Invalid post context' }, { status: 400 });
  }

  let commentUserId = session.user.id;
  try {
    commentUserId = await ensureAppUser(client, session.user);
  } catch (userError) {
    console.error('Error upserting user:', userError);
    return NextResponse.json({ error: 'Failed to persist user profile' }, { status: 500 });
  }

  const { data, error } = await client
    .from('comments')
    .insert({
      post_id: scope.postId,
      post_localization_id: scope.postLocalizationId,
      user_id: commentUserId,
      body: commentBody,
      status: 'visible',
    })
    .select('id, post_id, post_localization_id, user_id, body, status, created_at, updated_at, app_users(name, image, email)')
    .single();

  if (error || !data) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    comment: mapCommentRow(data),
  });
}
