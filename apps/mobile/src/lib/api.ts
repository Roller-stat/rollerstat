import { fetchWithReadCache } from './cache';
import { API_BASE_URL } from './config';
import { getDeviceId } from './device-id';
import {
  AppLocale,
  MobileComment,
  MobilePostDetail,
  MobilePostSummary,
  MobileUser,
  ReactionCounts,
  ReactionType,
} from '../types/content';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | undefined | null>;
};

function withQuery(path: string, query: RequestOptions['query']) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    params.set(key, String(value));
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${withQuery(path, options.query)}`;
  const deviceId = await getDeviceId();

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-mobile-device-id': deviceId,
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error?: string }).error || 'Request failed.')
        : 'Request failed.';
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export async function listPosts(params: {
  locale: AppLocale;
  type: 'all' | 'news' | 'blog';
  page?: number;
  pageSize?: number;
  dateRange?: string;
  customDate?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{
  items: MobilePostSummary[];
  page: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
}> {
  const cacheKey = `mobile:posts:${params.type}:${params.locale}:${params.page || 1}:${params.pageSize || 12}:${params.dateRange || 'all'}:${params.customDate || ''}:${params.sortOrder || 'desc'}`;

  return fetchWithReadCache({
    cacheKey,
    fetcher: () =>
      requestJson('/api/mobile/posts', {
        query: {
          locale: params.locale,
          type: params.type,
          page: params.page || 1,
          pageSize: params.pageSize || 12,
          dateRange: params.dateRange || 'all',
          customDate: params.customDate || undefined,
          sortOrder: params.sortOrder || 'desc',
        },
      }),
  });
}

export async function getPostDetail(params: {
  locale: AppLocale;
  type: 'news' | 'blog';
  slug: string;
}): Promise<MobilePostDetail> {
  const cacheKey = `mobile:post:${params.type}:${params.locale}:${params.slug}`;

  const payload = await fetchWithReadCache<{ item: MobilePostDetail }>({
    cacheKey,
    fetcher: () =>
      requestJson(`/api/mobile/posts/${params.type}/${params.slug}`, {
        query: {
          locale: params.locale,
        },
      }),
  });

  return payload.item;
}

export async function getComments(params: {
  postId: string;
  postLocalizationId: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  comments: MobileComment[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}> {
  return requestJson('/api/comments', {
    query: {
      postId: params.postId,
      postLocalizationId: params.postLocalizationId,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      sortOrder: 'desc',
    },
  });
}

export async function createComment(params: {
  token: string;
  postId: string;
  postLocalizationId: string;
  body: string;
}) {
  return requestJson('/api/comments', {
    method: 'POST',
    token: params.token,
    body: {
      postId: params.postId,
      postLocalizationId: params.postLocalizationId,
      body: params.body,
    },
  });
}

export async function updateComment(params: {
  token: string;
  commentId: string;
  body: string;
}) {
  return requestJson(`/api/comments/${params.commentId}`, {
    method: 'PATCH',
    token: params.token,
    body: {
      body: params.body,
    },
  });
}

export async function deleteComment(params: {
  token: string;
  commentId: string;
}) {
  return requestJson(`/api/comments/${params.commentId}`, {
    method: 'DELETE',
    token: params.token,
  });
}

export async function getReactions(params: {
  postId: string;
  postLocalizationId: string;
  token?: string | null;
}): Promise<{
  counts: ReactionCounts;
  selectedReactionType: ReactionType | null;
  disabled: boolean;
}> {
  return requestJson('/api/reactions', {
    token: params.token,
    query: {
      postId: params.postId,
      postLocalizationId: params.postLocalizationId,
    },
  });
}

export async function toggleReaction(params: {
  postId: string;
  postLocalizationId: string;
  reactionType: ReactionType;
  token?: string | null;
}): Promise<{
  success: boolean;
  counts: ReactionCounts;
  selectedReactionType: ReactionType | null;
}> {
  return requestJson('/api/reactions', {
    method: 'POST',
    token: params.token,
    body: {
      postId: params.postId,
      postLocalizationId: params.postLocalizationId,
      reactionType: params.reactionType,
    },
  });
}

export async function signInWithGoogle(idToken: string): Promise<{
  success: true;
  token: string;
  user: MobileUser;
}> {
  return requestJson('/api/mobile/auth/google', {
    method: 'POST',
    body: { idToken },
  });
}

export async function getMobileSession(token: string): Promise<{
  authenticated: boolean;
  user: MobileUser;
}> {
  return requestJson('/api/mobile/auth/session', {
    token,
  });
}

export async function mobileLogout(token: string): Promise<{ success: boolean }> {
  return requestJson('/api/mobile/auth/logout', {
    method: 'POST',
    token,
  });
}

export async function deleteMobileAccount(token: string): Promise<{
  success: boolean;
  deleted: boolean;
  message?: string;
}> {
  return requestJson('/api/mobile/account/delete', {
    method: 'POST',
    token,
  });
}
