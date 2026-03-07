import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { Locale } from '@/lib/i18n';
import { getSupabaseServerClient, isDatabaseConfigured } from '@/lib/db/client';

export type ContentType = 'news' | 'blog';

export interface PostRecord {
  _id: string;
  id: string;
  postId?: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  updated?: string;
  locale: Locale;
  tags: string[];
  coverImage?: string;
  heroVideo?: string;
  author: string;
  translation_key?: string;
  contentType: ContentType;
  featured: boolean;
  published: boolean;
  readingTime: number;
  url: string;
  body?: {
    raw: string;
  };
}

type LegacyFrontmatter = Record<string, string | boolean | string[] | undefined>;

function resolveContentDirPath(): string {
  const configuredRoot = process.env.CONTENT_ROOT;
  if (configuredRoot) {
    return path.isAbsolute(configuredRoot)
      ? configuredRoot
      : path.resolve(process.cwd(), configuredRoot);
  }

  const candidates = [
    path.join(process.cwd(), 'packages', 'content', 'posts'),
    path.join(process.cwd(), '..', 'packages', 'content', 'posts'),
    path.join(process.cwd(), '..', '..', 'packages', 'content', 'posts'),
  ];

  const existing = candidates.find((candidate) => fsSync.existsSync(candidate));
  return existing ?? candidates[candidates.length - 1];
}

function toReadingTime(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function toPostUrl(locale: string, type: ContentType, slug: string): string {
  const section = type === 'news' ? 'news' : 'blogs';
  return `/${locale}/${section}/${slug}`;
}

function parseFrontmatter(raw: string): { data: LegacyFrontmatter; body: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) return null;

  const [, frontmatter, body] = match;
  const data: LegacyFrontmatter = {};

  for (const line of frontmatter.split('\n')) {
    const [rawKey, ...valueParts] = line.split(':');
    if (!rawKey || valueParts.length === 0) continue;

    const key = rawKey.trim();
    let value = valueParts.join(':').trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(',').map((item) => item.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')).filter(Boolean)
        : [];
      continue;
    }

    if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
      continue;
    }

    data[key] = value;
  }

  return { data, body: body.trim() };
}

async function walkMdxFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await walkMdxFiles(abs)));
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(abs);
      }
    }

    return files;
  } catch {
    return [];
  }
}

async function readPostsFromFiles(): Promise<PostRecord[]> {
  const files = await walkMdxFiles(resolveContentDirPath());
  const out: PostRecord[] = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed) continue;

    const locale = String(parsed.data.locale || '').trim() as Locale;
    if (!['en', 'es', 'fr', 'it', 'pt'].includes(locale)) continue;

    const contentType = parsed.data.contentType === 'news' ? 'news' : 'blog';
    const slug = String(parsed.data.slug || path.basename(filePath, '.mdx')).trim();
    const date = String(parsed.data.date || new Date().toISOString());
    const body = parsed.body;

    out.push({
      _id: `${locale}-${contentType}-${slug}`,
      id: `${locale}-${contentType}-${slug}`,
      title: String(parsed.data.title || slug),
      slug,
      summary: String(parsed.data.summary || ''),
      date,
      updated: typeof parsed.data.updated === 'string' ? parsed.data.updated : undefined,
      locale,
      tags: Array.isArray(parsed.data.tags) ? (parsed.data.tags as string[]) : [],
      coverImage: typeof parsed.data.coverImage === 'string' ? parsed.data.coverImage : undefined,
      heroVideo: typeof parsed.data.heroVideo === 'string' ? parsed.data.heroVideo : undefined,
      author: String(parsed.data.author || 'Unknown'),
      translation_key: typeof parsed.data.translation_key === 'string' ? parsed.data.translation_key : undefined,
      contentType,
      featured: parsed.data.featured === true,
      published: parsed.data.published !== false,
      readingTime: toReadingTime(body),
      url: toPostUrl(locale, contentType, slug),
      body: { raw: body },
    });
  }

  return out.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function readPostsFromDb(locale?: Locale): Promise<PostRecord[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  let query = client
    .from('post_localizations')
    .select('id, post_id, locale, slug, title, summary, body_mdx, cover_image, hero_video, author, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (locale) {
    query = query.eq('locale', locale);
  }

  const { data: localizationRows, error } = await query;
  if (error || !localizationRows || localizationRows.length === 0) {
    return [];
  }

  const postIds = [...new Set(localizationRows.map((row) => row.post_id))];
  const { data: postRows } = await client
    .from('posts')
    .select('id, kind, translation_group_key')
    .in('id', postIds);

  const postMap = new Map((postRows || []).map((row) => [row.id, row]));

  const localizationIds = localizationRows.map((row) => row.id);
  const { data: tagRows } = await client
    .from('post_localization_tags')
    .select('post_localization_id, tags(name)')
    .in('post_localization_id', localizationIds);

  const tagMap = new Map<string, string[]>();
  for (const row of tagRows || []) {
    const current = tagMap.get(row.post_localization_id) || [];
    const tagRelation = row.tags as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(tagRelation) ? tagRelation[0]?.name : tagRelation?.name;
    if (name) {
      current.push(name);
      tagMap.set(row.post_localization_id, current);
    }
  }

  const mapped: PostRecord[] = [];
  for (const row of localizationRows) {
    const post = postMap.get(row.post_id);
    if (!post) {
      continue;
    }

    const contentType: ContentType = post.kind === 'news' ? 'news' : 'blog';
    const date = row.published_at || row.created_at || new Date().toISOString();
    const body = row.body_mdx || '';

    mapped.push({
      _id: row.id,
      id: row.id,
      postId: row.post_id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      date,
      updated: row.updated_at || undefined,
      locale: row.locale as Locale,
      tags: tagMap.get(row.id) || [],
      coverImage: row.cover_image || undefined,
      heroVideo: row.hero_video || undefined,
      author: row.author,
      translation_key: post.translation_group_key,
      contentType,
      featured: false,
      published: row.status === 'published',
      readingTime: toReadingTime(body),
      url: toPostUrl(row.locale, contentType, row.slug),
      body: { raw: body },
    });
  }

  return mapped;
}

export function isValidPost(post: PostRecord): boolean {
  return !!(
    post.title &&
    post.slug &&
    post.summary &&
    post.date &&
    post.locale &&
    post.contentType &&
    post.author
  );
}

function logContentStats(message: string, latestPost?: { title: string; date: string }) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log(message);
  if (latestPost) {
    console.log(`${latestPost.title} (${latestPost.date})`);
  }
}

export async function getAllPosts(): Promise<PostRecord[]> {
  if (isDatabaseConfigured()) {
    const dbPosts = await readPostsFromDb();
    if (dbPosts.length > 0) {
      return dbPosts;
    }
  }
  return readPostsFromFiles();
}

export async function getPostsByLocale(locale: Locale): Promise<PostRecord[]> {
  const posts = (await getAllPosts())
    .filter((post) => isValidPost(post) && post.locale === locale && post.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  logContentStats(
    `getPostsByLocale(${locale}): Found ${posts.length} posts`,
    posts[0] ? { title: `Latest post: ${posts[0].title}`, date: posts[0].date } : undefined,
  );

  return posts;
}

export async function getPostsByType(type: ContentType, locale: Locale): Promise<PostRecord[]> {
  const posts = (await getAllPosts())
    .filter((post) =>
      isValidPost(post) &&
      post.contentType === type &&
      post.locale === locale &&
      post.published !== false,
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  logContentStats(
    `getPostsByType(${type}, ${locale}): Found ${posts.length} posts`,
    posts[0] ? { title: `Latest ${type} post: ${posts[0].title}`, date: posts[0].date } : undefined,
  );

  return posts;
}

export async function getLatestPost(locale: Locale): Promise<PostRecord | undefined> {
  const posts = await getPostsByLocale(locale);
  return posts[0];
}

export async function getLatestBlogs(locale: Locale, limit = 3): Promise<PostRecord[]> {
  const blogs = await getPostsByType('blog', locale);
  return blogs.slice(0, limit);
}

export async function getPostBySlug(slug: string, locale: Locale, type: ContentType): Promise<PostRecord | undefined> {
  const posts = await getPostsByType(type, locale);
  return posts.find((post) => post.slug === slug);
}

export async function getRelatedPosts(post: PostRecord, limit = 3): Promise<PostRecord[]> {
  const posts = await getPostsByLocale(post.locale);
  return posts
    .filter((candidate) =>
      candidate._id !== post._id &&
      candidate.published !== false &&
      candidate.tags.some((tag) => post.tags.includes(tag)),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function formatDate(date: string, locale: Locale): string {
  try {
    const dateObj = new Date(date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export function getTimeAgo(date: string, locale: Locale): string {
  try {
    const now = new Date();
    const postDate = new Date(date);

    if (Number.isNaN(postDate.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return locale === 'es' ? 'Hace menos de 1 hora' : 'Less than 1 hour ago';
    }

    if (diffInHours < 24) {
      return locale === 'es' ? `Hace ${diffInHours} horas` : `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return locale === 'es' ? `Hace ${diffInDays} días` : `${diffInDays} days ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return locale === 'es' ? 'Fecha no disponible' : 'Date not available';
  }
}

export function filterPostsByDateRange(posts: PostRecord[], dateRange: string): PostRecord[] {
  const now = new Date();
  const ranges: Record<string, number | null> = {
    '7days': 7,
    '30days': 30,
    '3months': 90,
    'all': null,
  };

  if (dateRange === 'all' || !dateRange) {
    return posts;
  }

  const days = ranges[dateRange];
  if (!days) {
    return posts;
  }

  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return posts.filter((post) => new Date(post.date) >= cutoffDate);
}

export function filterPostsByCustomDate(posts: PostRecord[], customDate: string): PostRecord[] {
  if (!customDate) return posts;

  const targetDate = new Date(customDate);
  return posts.filter((post) => {
    const postDate = new Date(post.date);
    return postDate.toDateString() === targetDate.toDateString();
  });
}

export function sortPostsByDate(posts: PostRecord[], order: 'asc' | 'desc' = 'desc'): PostRecord[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterAndSortPosts(
  posts: PostRecord[],
  filters: {
    dateRange?: string;
    customDate?: string;
    sortOrder?: 'asc' | 'desc';
  },
): PostRecord[] {
  let filtered = posts;

  if (filters.customDate) {
    filtered = filterPostsByCustomDate(filtered, filters.customDate);
  } else if (filters.dateRange && filters.dateRange !== 'all') {
    filtered = filterPostsByDateRange(filtered, filters.dateRange);
  }

  filtered = sortPostsByDate(filtered, filters.sortOrder || 'desc');
  return filtered;
}
