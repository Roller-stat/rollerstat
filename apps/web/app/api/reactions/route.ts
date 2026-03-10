import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getSupabaseServerClient } from '@/lib/db/client';
import { auth } from '@/lib/auth';

const DEVICE_COOKIE_NAME = 'rs_device_id';
const REACTION_TYPES = ['like', 'applaud', 'love', 'dislike'] as const;
type ReactionType = (typeof REACTION_TYPES)[number];
type ReactionCounts = Record<ReactionType, number>;
type ReactionScopeMode = 'post' | 'localization';
type SupabaseServerClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;

function createEmptyCounts(): ReactionCounts {
  return {
    like: 0,
    applaud: 0,
    love: 0,
    dislike: 0,
  };
}

function isValidReactionType(value: string): value is ReactionType {
  return REACTION_TYPES.includes(value as ReactionType);
}

function isMissingTableError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST205'
  );
}

function isReactionConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23514'
  );
}

function isMissingPostIdColumnError(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? (error as { message?: string }).message
      : undefined;

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '42703' &&
    typeof message === 'string' &&
    message.includes('reactions.post_id')
  );
}

function hashDeviceId(deviceId: string) {
  const salt = process.env.REACTION_DEVICE_SALT?.trim();
  if (!salt) {
    throw new Error('REACTION_DEVICE_SALT is not configured');
  }

  return crypto.createHash('sha256').update(`${deviceId}:${salt}`).digest('hex');
}

async function resolveDeviceHash() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEVICE_COOKIE_NAME)?.value;
  const deviceId = existing || crypto.randomUUID();

  return {
    deviceId,
    isNew: !existing,
    deviceHash: hashDeviceId(deviceId),
  };
}

async function resolveActorHash(userId?: string) {
  const device = await resolveDeviceHash();

  if (userId) {
    return {
      ...device,
      actorHash: hashDeviceId(`user:${userId}`),
    };
  }

  return {
    ...device,
    actorHash: device.deviceHash,
  };
}

async function resolvePostScope(
  client: ReturnType<typeof getSupabaseServerClient>,
  postIdInput: string | null,
  postLocalizationIdInput: string | null,
): Promise<{ postId: string; postLocalizationId: string } | null> {
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
    postId: postId as string,
    postLocalizationId: postLocalizationId as string,
  };
}

async function resolveReactionScopeMode(
  client: SupabaseServerClient,
  scope: { postId: string; postLocalizationId: string },
): Promise<{ schemaReady: boolean; scopeMode: ReactionScopeMode }> {
  let scopeMode: ReactionScopeMode = 'post';

  let probe = await client
    .from('reactions')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', scope.postId);

  if (probe.error && isMissingPostIdColumnError(probe.error)) {
    scopeMode = 'localization';
    probe = await client
      .from('reactions')
      .select('id', { count: 'exact', head: true })
      .eq('post_localization_id', scope.postLocalizationId);
  }

  if (probe.error) {
    if (isMissingTableError(probe.error)) {
      return {
        schemaReady: false,
        scopeMode,
      };
    }
    throw probe.error;
  }

  return {
    schemaReady: true,
    scopeMode,
  };
}

async function countReactionsByType(
  client: SupabaseServerClient,
  scope: { postId: string; postLocalizationId: string },
  scopeMode: ReactionScopeMode,
): Promise<ReactionCounts> {
  const counts = createEmptyCounts();
  const scopeColumn = scopeMode === 'post' ? 'post_id' : 'post_localization_id';
  const scopeValue = scopeMode === 'post' ? scope.postId : scope.postLocalizationId;

  const countResults = await Promise.all(
    REACTION_TYPES.map(async (reactionType) => {
      const { count, error } = await client
        .from('reactions')
        .select('id', { count: 'exact', head: true })
        .eq(scopeColumn, scopeValue)
        .eq('reaction_type', reactionType);

      if (error) {
        throw error;
      }

      return {
        reactionType,
        count: count ?? 0,
      };
    }),
  );

  for (const result of countResults) {
    counts[result.reactionType] = result.count;
  }

  return counts;
}

async function getReactionState(
  scope: { postId: string; postLocalizationId: string },
  deviceHash: string,
) {
  const client = getSupabaseServerClient();
  if (!client) {
    return {
      counts: createEmptyCounts(),
      selectedReactionType: null,
      existingReactionId: null,
      schemaReady: false,
      scopeMode: 'post' as ReactionScopeMode,
    };
  }

  const scopeResolution = await resolveReactionScopeMode(client, scope);
  if (!scopeResolution.schemaReady) {
    return {
      counts: createEmptyCounts(),
      selectedReactionType: null,
      existingReactionId: null,
      schemaReady: false,
      scopeMode: scopeResolution.scopeMode,
    };
  }

  const scopeMode = scopeResolution.scopeMode;
  const counts = await countReactionsByType(client, scope, scopeMode);

  const existingResult =
    scopeMode === 'post'
      ? await client
          .from('reactions')
          .select('id, reaction_type')
          .eq('post_id', scope.postId)
          .eq('device_hash', deviceHash)
          .maybeSingle()
      : await client
      .from('reactions')
      .select('id, reaction_type')
      .eq('post_localization_id', scope.postLocalizationId)
      .eq('device_hash', deviceHash)
      .maybeSingle();

  const { data: existing, error: existingError } = existingResult;

  if (existingError) {
    if (isMissingTableError(existingError)) {
      return {
        counts,
        selectedReactionType: null,
        existingReactionId: null,
        schemaReady: false,
        scopeMode,
      };
    }
    throw existingError;
  }

  const selectedReactionType = existing?.reaction_type && isValidReactionType(existing.reaction_type)
    ? existing.reaction_type
    : null;

  return {
    counts,
    selectedReactionType,
    existingReactionId: existing?.id || null,
    schemaReady: true,
    scopeMode,
  };
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('postId');
  const postLocalizationId = request.nextUrl.searchParams.get('postLocalizationId');
  if (!postId && !postLocalizationId) {
    return NextResponse.json({ error: 'postId or postLocalizationId is required' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({
      counts: createEmptyCounts(),
      selectedReactionType: null,
      disabled: true,
    });
  }

  const session = await auth();
  let actor: Awaited<ReturnType<typeof resolveActorHash>>;
  try {
    actor = await resolveActorHash(session?.user?.id);
  } catch (error) {
    console.error('Reaction endpoint is not configured:', error);
    return NextResponse.json(
      { error: 'Reactions are not configured on this server' },
      { status: 503 },
    );
  }

  const scope = await resolvePostScope(client, postId, postLocalizationId);
  if (!scope) {
    return NextResponse.json({
      counts: createEmptyCounts(),
      selectedReactionType: null,
      disabled: true,
    });
  }

  let state;
  try {
    state = await getReactionState(scope, actor.actorHash);
  } catch (error) {
    console.error('Error loading reactions:', error);
    return NextResponse.json({ error: 'Failed to load reactions' }, { status: 500 });
  }

  const response = NextResponse.json({
    counts: state.counts,
    selectedReactionType: state.selectedReactionType,
    disabled: !state.schemaReady,
  });

  if (actor.isNew) {
    response.cookies.set(DEVICE_COOKIE_NAME, actor.deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const postId = String(body.postId || '').trim();
  const postLocalizationId = String(body.postLocalizationId || '').trim();
  const reactionType = String(body.reactionType || '').trim();

  if (!postId && !postLocalizationId) {
    return NextResponse.json({ error: 'postId or postLocalizationId is required' }, { status: 400 });
  }
  if (!isValidReactionType(reactionType)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
  }

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({ error: 'Database is not configured' }, { status: 500 });
  }

  const session = await auth();
  let actor: Awaited<ReturnType<typeof resolveActorHash>>;
  try {
    actor = await resolveActorHash(session?.user?.id);
  } catch (error) {
    console.error('Reaction endpoint is not configured:', error);
    return NextResponse.json(
      { error: 'Reactions are not configured on this server' },
      { status: 503 },
    );
  }

  const scope = await resolvePostScope(client, postId || null, postLocalizationId || null);
  if (!scope) {
    return NextResponse.json({ error: 'Invalid post context' }, { status: 400 });
  }

  let state;
  try {
    state = await getReactionState(scope, actor.actorHash);
  } catch (error) {
    console.error('Error loading reaction state:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }

  if (!state.schemaReady) {
    return NextResponse.json({ error: 'Reaction tables are not initialized' }, { status: 503 });
  }

  let nextSelectedReactionType: ReactionType | null = state.selectedReactionType;

  if (state.existingReactionId && state.selectedReactionType === reactionType) {
    const { error } = await client
      .from('reactions')
      .delete()
      .eq('id', state.existingReactionId);

    if (error) {
      console.error('Error removing reaction:', error);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    nextSelectedReactionType = null;
  } else if (state.existingReactionId) {
    const { error } = await client
      .from('reactions')
      .update({ reaction_type: reactionType })
      .eq('id', state.existingReactionId);

    if (error) {
      if (isReactionConstraintError(error)) {
        return NextResponse.json(
          { error: 'Run DB migration: packages/db/migrations/20260306_expand_reaction_types.sql' },
          { status: 409 },
        );
      }
      console.error('Error changing reaction:', error);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    nextSelectedReactionType = reactionType;
  } else {
    const insertPayload =
      state.scopeMode === 'localization'
        ? {
            post_localization_id: scope.postLocalizationId,
            device_hash: actor.actorHash,
            reaction_type: reactionType,
          }
        : {
            post_id: scope.postId,
            post_localization_id: scope.postLocalizationId,
            device_hash: actor.actorHash,
            reaction_type: reactionType,
          };

    const { error } = await client.from('reactions').insert(insertPayload);

    if (error) {
      if (isReactionConstraintError(error)) {
        return NextResponse.json(
          { error: 'Run DB migration: packages/db/migrations/20260306_expand_reaction_types.sql' },
          { status: 409 },
        );
      }
      console.error('Error creating reaction:', error);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    nextSelectedReactionType = reactionType;
  }

  let nextState;
  try {
    nextState = await getReactionState(scope, actor.actorHash);
  } catch (error) {
    console.error('Error reloading reactions:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }

  if (!nextState.schemaReady) {
    return NextResponse.json({ error: 'Reaction tables are not initialized' }, { status: 503 });
  }

  const response = NextResponse.json({
    success: true,
    counts: nextState.counts,
    selectedReactionType: nextSelectedReactionType,
  });

  if (actor.isNew) {
    response.cookies.set(DEVICE_COOKIE_NAME, actor.deviceId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
