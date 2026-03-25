import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/content';
import { defaultLocale, isValidLocale, Locale } from '@/lib/i18n';
import { isDatabaseConfigured } from '@/lib/db/client';

type AllowedType = 'news' | 'blog';

function normalizeType(value: string): AllowedType | null {
  if (value === 'news' || value === 'blog') {
    return value;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type: rawType, slug } = await params;
  const type = normalizeType(rawType);
  if (!type) {
    return NextResponse.json({ error: 'Invalid post type.' }, { status: 400 });
  }

  const localeParam = request.nextUrl.searchParams.get('locale');
  const locale: Locale = localeParam && isValidLocale(localeParam) ? localeParam : defaultLocale;

  const post = await getPostBySlug(slug, locale, type);
  if (!post) {
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  }

  return NextResponse.json({
    item: {
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
      body: post.body?.raw || '',
      interactionsEnabled: isDatabaseConfigured(),
    },
  });
}
