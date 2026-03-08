import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';

type CommentStatus = 'visible' | 'hidden' | 'deleted';
type PostType = 'news' | 'blog';
type Locale = 'en' | 'es' | 'fr' | 'it' | 'pt';

const VALID_STATUSES: readonly CommentStatus[] = ['visible', 'hidden', 'deleted'];
const VALID_TYPES: readonly PostType[] = ['news', 'blog'];
const VALID_LOCALES: readonly Locale[] = ['en', 'es', 'fr', 'it', 'pt'];

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isCommentStatus(value: string): value is CommentStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

function isPostType(value: string): value is PostType {
  return (VALID_TYPES as readonly string[]).includes(value);
}

function isLocale(value: string): value is Locale {
  return (VALID_LOCALES as readonly string[]).includes(value);
}

function isMissingCommentsPostIdColumnError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === '42703' &&
    typeof error.message === 'string' &&
    error.message.includes('comments.post_id')
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 1,
      filters: { posts: [] },
    });
  }

  const statusParam = request.nextUrl.searchParams.get('status');
  const typeParam = request.nextUrl.searchParams.get('type');
  const localeParam = request.nextUrl.searchParams.get('locale');
  const postLocalizationIdParam = request.nextUrl.searchParams.get('postLocalizationId');
  const searchQuery = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  const requestedPage = parsePositiveInt(request.nextUrl.searchParams.get('page'), 1);
  const pageSize = clamp(parsePositiveInt(request.nextUrl.searchParams.get('pageSize'), 25), 5, 100);

  const statusFilter = statusParam && isCommentStatus(statusParam) ? statusParam : 'all';
  const typeFilter = typeParam && isPostType(typeParam) ? typeParam : 'all';
  const localeFilter = localeParam && isLocale(localeParam) ? localeParam : 'all';
  const postLocalizationIdFilter =
    postLocalizationIdParam && postLocalizationIdParam !== 'all' ? postLocalizationIdParam : 'all';

  const client = getSupabaseServerClient();
  if (!client) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      filters: { posts: [] },
    });
  }

  let typeScopedPostIds: string[] | null = null;
  if (typeFilter !== 'all') {
    const { data: typePosts, error: typePostsError } = await client
      .from('posts')
      .select('id')
      .eq('kind', typeFilter);

    if (typePostsError) {
      console.error('Error fetching post ids for type filter:', typePostsError);
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
    }

    typeScopedPostIds = (typePosts || []).map((post) => post.id);
  }

  let localizationScopeQuery = client
    .from('post_localizations')
    .select('id, post_id, locale, slug, title');

  if (localeFilter !== 'all') {
    localizationScopeQuery = localizationScopeQuery.eq('locale', localeFilter);
  }
  if (typeScopedPostIds !== null) {
    if (typeScopedPostIds.length === 0) {
      return NextResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize,
        totalPages: 1,
        filters: { posts: [] },
      });
    }
    localizationScopeQuery = localizationScopeQuery.in('post_id', typeScopedPostIds);
  }

  const { data: localizationScope, error: localizationScopeError } = await localizationScopeQuery;
  if (localizationScopeError) {
    console.error('Error fetching post localization scope for comments:', localizationScopeError);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  if (!localizationScope || localizationScope.length === 0) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      filters: { posts: [] },
    });
  }

  const scopePostIds = [...new Set(localizationScope.map((row) => row.post_id))];
  const { data: scopePosts, error: scopePostsError } = await client
    .from('posts')
    .select('id, kind')
    .in('id', scopePostIds);

  if (scopePostsError) {
    console.error('Error fetching post kinds for comment scope:', scopePostsError);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  const scopePostMap = new Map((scopePosts || []).map((row) => [row.id, row]));

  const scopedLocalizations = localizationScope.filter((row) => {
    const post = scopePostMap.get(row.post_id);
    if (!post) {
      return false;
    }
    if (typeFilter !== 'all' && post.kind !== typeFilter) {
      return false;
    }
    return true;
  });

  const postOptions = scopedLocalizations
    .map((row) => {
      const post = scopePostMap.get(row.post_id);
      if (!post) {
        return null;
      }

      return {
        id: row.id,
        locale: row.locale,
        slug: row.slug,
        title: row.title,
        type: post.kind,
      };
    })
    .filter((row): row is { id: string; locale: string; slug: string; title: string; type: string } => row !== null)
    .sort((a, b) => a.title.localeCompare(b.title));

  const localizationMap = new Map(scopedLocalizations.map((row) => [row.id, row]));
  let scopedPostIdsForComments = [...new Set(scopedLocalizations.map((row) => row.post_id))];
  let scopedLocalizationIdsForComments = [...new Set(scopedLocalizations.map((row) => row.id))];

  if (postLocalizationIdFilter !== 'all') {
    const selectedLocalization = localizationMap.get(postLocalizationIdFilter);
    scopedPostIdsForComments = selectedLocalization ? [selectedLocalization.post_id] : [];
    scopedLocalizationIdsForComments = selectedLocalization ? [selectedLocalization.id] : [];
  }

  if (scopedPostIdsForComments.length === 0 || scopedLocalizationIdsForComments.length === 0) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      filters: { posts: postOptions },
    });
  }

  let commentsQuery = client
    .from('comments')
    .select('id, post_id, post_localization_id, user_id, body, status, created_at, updated_at')
    .in('post_id', scopedPostIdsForComments)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') {
    commentsQuery = commentsQuery.eq('status', statusFilter);
  }

  let { data: comments, error } = await commentsQuery;
  let isLegacyCommentsSchema = false;

  if (error && isMissingCommentsPostIdColumnError(error)) {
    isLegacyCommentsSchema = true;
    let legacyCommentsQuery = client
      .from('comments')
      .select('id, post_localization_id, user_id, body, status, created_at, updated_at')
      .in('post_localization_id', scopedLocalizationIdsForComments)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      legacyCommentsQuery = legacyCommentsQuery.eq('status', statusFilter);
    }

    const legacyResult = await legacyCommentsQuery;
    comments = (legacyResult.data || []).map((comment) => ({
      ...comment,
      post_id: null,
    }));
    error = legacyResult.error;
  }

  if (error || !comments) {
    console.error('Error fetching comments for admin:', error);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  if (comments.length === 0) {
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      filters: { posts: postOptions },
    });
  }

  const userIds = [...new Set(comments.map((comment) => comment.user_id))];

  const { data: users } = await client
    .from('app_users')
    .select('id, email, name')
    .in('id', userIds);

  const userMap = new Map((users || []).map((user) => [user.id, user]));

  const mapped = comments.map((comment) => {
    const user = userMap.get(comment.user_id);
    const localization = localizationMap.get(comment.post_localization_id);
    const post = localization ? scopePostMap.get(localization.post_id) : null;

    return {
      id: comment.id,
      body: comment.body,
      status: comment.status,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      userId: comment.user_id,
      userName: user?.name || 'User',
      userEmail: user?.email || null,
      postId: comment.post_id || localization?.post_id || null,
      postLocalizationId: comment.post_localization_id,
      locale: localization?.locale || null,
      slug: localization?.slug || null,
      postTitle: localization?.title || null,
      type: post?.kind || null,
    };
  });

  const searched = searchQuery
    ? mapped.filter((comment) => {
        return (
          comment.body.toLowerCase().includes(searchQuery) ||
          comment.userName.toLowerCase().includes(searchQuery) ||
          (comment.userEmail || '').toLowerCase().includes(searchQuery) ||
          (comment.postTitle || '').toLowerCase().includes(searchQuery)
        );
      })
    : mapped;

  const total = searched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clamp(requestedPage, 1, totalPages);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = searched.slice(start, end);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages,
    filters: {
      posts: postOptions,
    },
    schema: {
      commentsScope: isLegacyCommentsSchema ? 'post_localization_id' : 'post_id',
    },
  });
}
