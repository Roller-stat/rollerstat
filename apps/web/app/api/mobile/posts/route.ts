import { NextRequest, NextResponse } from 'next/server';
import {
  filterAndSortPosts,
  getPostsByLocale,
  getPostsByType,
  PostRecord,
} from '@/lib/content';
import { defaultLocale, isValidLocale, Locale } from '@/lib/i18n';
import { isDatabaseConfigured } from '@/lib/db/client';

type MobilePostType = 'news' | 'blog' | 'all';

function toPositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveType(value: string | null): MobilePostType {
  if (value === 'news' || value === 'blog' || value === 'all') {
    return value;
  }
  return 'all';
}

function mapPostSummary(post: PostRecord) {
  return {
    id: post.id,
    postId: post.postId || post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    date: post.date,
    updated: post.updated || null,
    locale: post.locale,
    tags: post.tags,
    coverImage: post.coverImage || null,
    heroVideo: post.heroVideo || null,
    author: post.author,
    contentType: post.contentType,
    readingTime: post.readingTime,
    url: post.url,
  };
}

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale');
  const locale: Locale = localeParam && isValidLocale(localeParam) ? localeParam : defaultLocale;
  const type = resolveType(request.nextUrl.searchParams.get('type'));
  const page = toPositiveInt(request.nextUrl.searchParams.get('page'), 1);
  const pageSize = clamp(toPositiveInt(request.nextUrl.searchParams.get('pageSize'), 12), 1, 50);
  const dateRange = request.nextUrl.searchParams.get('dateRange') || 'all';
  const customDate = request.nextUrl.searchParams.get('customDate') || undefined;
  const sortOrder = request.nextUrl.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  let posts: PostRecord[] = [];
  if (type === 'news' || type === 'blog') {
    posts = await getPostsByType(type, locale);
  } else {
    posts = await getPostsByLocale(locale);
  }

  const filtered = filterAndSortPosts(posts, {
    dateRange,
    customDate,
    sortOrder,
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize).map(mapPostSummary);

  return NextResponse.json({
    items,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    hasMore: currentPage < totalPages,
    locale,
    type,
    interactionsEnabled: isDatabaseConfigured(),
  });
}
