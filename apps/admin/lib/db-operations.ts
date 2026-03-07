import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/db/client';
import { PostData, PostFile } from '@/lib/file-operations';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  TranslationMode,
  translatePostWithGemini,
} from '@/lib/gemini-translate';

const SUPPORTED_LOCALE_SET = new Set<SupportedLocale>(SUPPORTED_LOCALES);

type LocaleGenerationResult = {
  createdLocales: SupportedLocale[];
  skippedLocales: SupportedLocale[];
  failedLocales: Array<{ locale: SupportedLocale; reason: string }>;
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateTranslationKey(title: string): string {
  return generateSlug(title);
}

function getPublishedState(published: boolean) {
  return {
    status: published ? 'published' : 'draft',
    published_at: published ? new Date().toISOString() : null,
  };
}

function ensureClient() {
  const client = getSupabaseServerClient();
  if (!client) {
    throw new Error('Database is not configured.');
  }
  return client;
}

function toSupportedLocale(value: string | undefined | null): SupportedLocale | null {
  if (!value) {
    return null;
  }
  return SUPPORTED_LOCALE_SET.has(value as SupportedLocale) ? (value as SupportedLocale) : null;
}

function normalizeTargetLocales(sourceLocale: SupportedLocale, locales?: string[]): SupportedLocale[] {
  const unique = new Set<SupportedLocale>();
  for (const locale of locales || []) {
    const normalized = toSupportedLocale(locale);
    if (!normalized || normalized === sourceLocale) {
      continue;
    }
    unique.add(normalized);
  }
  return [...unique];
}

function normalizeTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function extractTagName(
  relation: { name?: string } | { name?: string }[] | null | undefined,
): string | null {
  if (!relation) {
    return null;
  }
  if (Array.isArray(relation)) {
    return relation[0]?.name || null;
  }
  return relation.name || null;
}

async function readTagsForLocalization(
  client: SupabaseClient,
  postLocalizationId: string,
): Promise<string[]> {
  const { data: tagRows } = await client
    .from('post_localization_tags')
    .select('tags(name)')
    .eq('post_localization_id', postLocalizationId);

  const out: string[] = [];
  for (const row of tagRows || []) {
    const name = extractTagName(row.tags as { name?: string } | { name?: string }[] | null);
    if (name) {
      out.push(name);
    }
  }
  return out;
}

async function syncTags(postLocalizationId: string, tags: string[]) {
  const client = getSupabaseServerClient();
  if (!client) return;

  const normalizedTags = normalizeTags(tags).map((tag) => tag.toLowerCase());

  await client.from('post_localization_tags').delete().eq('post_localization_id', postLocalizationId);

  for (const tagName of normalizedTags) {
    const { data: tagRow, error: tagError } = await client
      .from('tags')
      .upsert({ name: tagName }, { onConflict: 'name' })
      .select('id')
      .single();

    if (tagError || !tagRow) {
      throw new Error(`Failed to upsert tag: ${tagName}`);
    }

    const { error: linkError } = await client.from('post_localization_tags').upsert(
      {
        post_localization_id: postLocalizationId,
        tag_id: tagRow.id,
      },
      {
        onConflict: 'post_localization_id,tag_id',
      },
    );

    if (linkError) {
      throw new Error(`Failed to link tag: ${tagName}`);
    }
  }
}

async function createRevision(
  postLocalizationId: string,
  payload: {
    title: string;
    summary: string;
    bodyMdx: string;
    coverImage?: string;
    heroVideo?: string;
    author: string;
    tags: string[];
  },
) {
  const client = getSupabaseServerClient();
  if (!client) return;

  await client.from('post_revisions').insert({
    post_localization_id: postLocalizationId,
    title: payload.title,
    summary: payload.summary,
    body_mdx: payload.bodyMdx,
    cover_image: payload.coverImage || null,
    hero_video: payload.heroVideo || null,
    author: payload.author,
    tags: normalizeTags(payload.tags),
  });
}

async function resolveAvailableSlug(
  client: SupabaseClient,
  locale: SupportedLocale,
  preferredSlug: string,
  excludeLocalizationId?: string,
): Promise<string> {
  const base = preferredSlug || `post-${Date.now()}`;
  let candidate = base;
  let index = 2;

  while (true) {
    let query = client
      .from('post_localizations')
      .select('id')
      .eq('locale', locale)
      .eq('slug', candidate);

    if (excludeLocalizationId) {
      query = query.neq('id', excludeLocalizationId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${index}`;
    index += 1;
  }
}

async function createLocalizationRow(
  client: SupabaseClient,
  payload: {
    postId: string;
    locale: SupportedLocale;
    slug: string;
    title: string;
    summary: string;
    bodyMdx: string;
    coverImage?: string;
    heroVideo?: string;
    author: string;
    status: 'draft' | 'published';
    publishedAt: string | null;
    tags: string[];
  },
) {
  const { data: localizationRow, error: localizationError } = await client
    .from('post_localizations')
    .insert({
      post_id: payload.postId,
      locale: payload.locale,
      slug: payload.slug,
      title: payload.title,
      summary: payload.summary,
      body_mdx: payload.bodyMdx,
      cover_image: payload.coverImage || null,
      hero_video: payload.heroVideo || null,
      author: payload.author,
      status: payload.status,
      published_at: payload.publishedAt,
    })
    .select('id')
    .single();

  if (localizationError || !localizationRow) {
    throw new Error(localizationError?.message || 'Failed creating localization row.');
  }

  await syncTags(localizationRow.id, payload.tags);
  await createRevision(localizationRow.id, {
    title: payload.title,
    summary: payload.summary,
    bodyMdx: payload.bodyMdx,
    coverImage: payload.coverImage,
    heroVideo: payload.heroVideo,
    author: payload.author,
    tags: payload.tags,
  });

  return localizationRow.id;
}

async function generateLocaleDraftsForPost(
  client: SupabaseClient,
  payload: {
    postId: string;
    sourceLocale: SupportedLocale;
    sourceTitle: string;
    sourceSummary: string;
    sourceContent: string;
    sourceTags: string[];
    sourceAuthor: string;
    sourceCoverImage?: string;
    sourceHeroVideo?: string;
    targetLocales: SupportedLocale[];
    mode: TranslationMode;
  },
): Promise<LocaleGenerationResult> {
  const existingLocalesResult = await client
    .from('post_localizations')
    .select('locale')
    .eq('post_id', payload.postId);

  if (existingLocalesResult.error) {
    throw new Error(existingLocalesResult.error.message);
  }

  const existingLocales = new Set(
    (existingLocalesResult.data || [])
      .map((row) => toSupportedLocale(row.locale))
      .filter((row): row is SupportedLocale => Boolean(row)),
  );

  const createdLocales: SupportedLocale[] = [];
  const skippedLocales: SupportedLocale[] = [];
  const failedLocales: Array<{ locale: SupportedLocale; reason: string }> = [];

  for (const locale of payload.targetLocales) {
    if (existingLocales.has(locale)) {
      skippedLocales.push(locale);
      continue;
    }

    try {
      const translated = await translatePostWithGemini({
        sourceLocale: payload.sourceLocale,
        targetLocale: locale,
        mode: payload.mode,
        title: payload.sourceTitle,
        summary: payload.sourceSummary,
        content: payload.sourceContent,
        tags: payload.sourceTags,
      });

      const translatedSlug = await resolveAvailableSlug(
        client,
        locale,
        generateSlug(translated.title) || `post-${locale}-${payload.postId.slice(0, 8)}`,
      );

      await createLocalizationRow(client, {
        postId: payload.postId,
        locale,
        slug: translatedSlug,
        title: translated.title,
        summary: translated.summary,
        bodyMdx: translated.content,
        coverImage: payload.sourceCoverImage,
        heroVideo: payload.sourceHeroVideo,
        author: payload.sourceAuthor,
        status: 'draft',
        publishedAt: null,
        tags: translated.tags.length > 0 ? translated.tags : payload.sourceTags,
      });

      createdLocales.push(locale);
      existingLocales.add(locale);
    } catch (error) {
      failedLocales.push({
        locale,
        reason: error instanceof Error ? error.message : 'Unknown locale generation error',
      });
    }
  }

  return {
    createdLocales,
    skippedLocales,
    failedLocales,
  };
}

export async function createPost(
  data: PostData,
): Promise<{
  success: boolean;
  slug: string;
  filePath: string;
  generatedLocales?: SupportedLocale[];
  skippedLocales?: SupportedLocale[];
  failedLocales?: Array<{ locale: SupportedLocale; reason: string }>;
  error?: string;
}> {
  try {
    const client = ensureClient();
    const sourceLocale = toSupportedLocale(data.locale);
    if (!sourceLocale) {
      return {
        success: false,
        slug: '',
        filePath: '',
        error: `Unsupported locale "${data.locale}"`,
      };
    }

    const sourceSlug = generateSlug(data.title);

    const { data: existingSlugRow } = await client
      .from('post_localizations')
      .select('id')
      .eq('locale', sourceLocale)
      .eq('slug', sourceSlug)
      .maybeSingle();

    if (existingSlugRow) {
      return {
        success: false,
        slug: sourceSlug,
        filePath: '',
        error: `Post with slug "${sourceSlug}" already exists in ${sourceLocale}/${data.type}`,
      };
    }

    const translationKey = data.translation_key || generateTranslationKey(data.title);
    const { data: postRow, error: postError } = await client
      .from('posts')
      .upsert(
        {
          kind: data.type,
          translation_group_key: translationKey,
        },
        { onConflict: 'kind,translation_group_key' },
      )
      .select('id')
      .single();

    if (postError || !postRow) {
      throw new Error(postError?.message || 'Failed creating post row.');
    }

    const publishedState = getPublishedState(data.published);
    await createLocalizationRow(client, {
      postId: postRow.id,
      locale: sourceLocale,
      slug: sourceSlug,
      title: data.title,
      summary: data.summary,
      bodyMdx: data.content,
      coverImage: data.coverImage,
      heroVideo: data.heroVideo,
      author: data.author,
      status: publishedState.status as 'draft' | 'published',
      publishedAt: publishedState.published_at,
      tags: data.tags || [],
    });

    const targetLocales = normalizeTargetLocales(sourceLocale, data.targetLocales);
    const mode: TranslationMode = 'translate-only';

    let localeGeneration: LocaleGenerationResult | null = null;
    if (targetLocales.length > 0) {
      localeGeneration = await generateLocaleDraftsForPost(client, {
        postId: postRow.id,
        sourceLocale,
        sourceTitle: data.title,
        sourceSummary: data.summary,
        sourceContent: data.content,
        sourceTags: normalizeTags(data.tags || []),
        sourceAuthor: data.author,
        sourceCoverImage: data.coverImage,
        sourceHeroVideo: data.heroVideo,
        targetLocales,
        mode,
      });
    }

    return {
      success: true,
      slug: sourceSlug,
      filePath: `${sourceLocale}/${data.type}/${sourceSlug}`,
      generatedLocales: localeGeneration?.createdLocales || [],
      skippedLocales: localeGeneration?.skippedLocales || [],
      failedLocales: localeGeneration?.failedLocales || [],
    };
  } catch (error) {
    return {
      success: false,
      slug: '',
      filePath: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function generateLocaleDraftsForExistingPost(payload: {
  locale: string;
  type: 'news' | 'blog';
  slug: string;
  targetLocales: string[];
  translationMode?: TranslationMode;
  sourceOverride?: Partial<{
    title: string;
    summary: string;
    content: string;
    author: string;
    coverImage: string;
    heroVideo: string;
    tags: string[];
  }>;
}): Promise<{
  success: boolean;
  createdLocales?: SupportedLocale[];
  skippedLocales?: SupportedLocale[];
  failedLocales?: Array<{ locale: SupportedLocale; reason: string }>;
  error?: string;
}> {
  try {
    const client = ensureClient();
    const sourceLocale = toSupportedLocale(payload.locale);
    if (!sourceLocale) {
      return { success: false, error: `Unsupported locale "${payload.locale}"` };
    }

    const { data: sourceLocalization, error: sourceLocalizationError } = await client
      .from('post_localizations')
      .select('id, post_id, locale, slug, title, summary, body_mdx, cover_image, hero_video, author')
      .eq('locale', sourceLocale)
      .eq('slug', payload.slug)
      .maybeSingle();

    if (sourceLocalizationError || !sourceLocalization) {
      return {
        success: false,
        error: `Post with slug "${payload.slug}" not found in ${sourceLocale}/${payload.type}`,
      };
    }

    const { data: postRow, error: postRowError } = await client
      .from('posts')
      .select('id, kind')
      .eq('id', sourceLocalization.post_id)
      .single();

    if (postRowError || !postRow || postRow.kind !== payload.type) {
      return {
        success: false,
        error: `Post with slug "${payload.slug}" not found in ${sourceLocale}/${payload.type}`,
      };
    }

    const targetLocales = normalizeTargetLocales(sourceLocale, payload.targetLocales);
    if (targetLocales.length === 0) {
      return {
        success: true,
        createdLocales: [],
        skippedLocales: [],
        failedLocales: [],
      };
    }

    const sourceTags =
      payload.sourceOverride?.tags && payload.sourceOverride.tags.length > 0
        ? normalizeTags(payload.sourceOverride.tags)
        : await readTagsForLocalization(client, sourceLocalization.id);

    const sourceTitle = payload.sourceOverride?.title?.trim() || sourceLocalization.title;
    const sourceSummary = payload.sourceOverride?.summary?.trim() || sourceLocalization.summary;
    const sourceContent = payload.sourceOverride?.content || sourceLocalization.body_mdx;
    const sourceAuthor = payload.sourceOverride?.author?.trim() || sourceLocalization.author;
    const sourceCoverImage =
      payload.sourceOverride?.coverImage !== undefined
        ? payload.sourceOverride.coverImage || undefined
        : sourceLocalization.cover_image || undefined;
    const sourceHeroVideo =
      payload.sourceOverride?.heroVideo !== undefined
        ? payload.sourceOverride.heroVideo || undefined
        : sourceLocalization.hero_video || undefined;

    const localeGeneration = await generateLocaleDraftsForPost(client, {
      postId: sourceLocalization.post_id,
      sourceLocale,
      sourceTitle,
      sourceSummary,
      sourceContent,
      sourceTags,
      sourceAuthor,
      sourceCoverImage,
      sourceHeroVideo,
      targetLocales,
      mode: payload.translationMode || 'translate-only',
    });

    return {
      success: true,
      createdLocales: localeGeneration.createdLocales,
      skippedLocales: localeGeneration.skippedLocales,
      failedLocales: localeGeneration.failedLocales,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function updatePost(
  locale: string,
  type: 'news' | 'blog',
  slug: string,
  data: Partial<PostData>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = ensureClient();

    const { data: localizationRow, error: localizationFetchError } = await client
      .from('post_localizations')
      .select(
        'id, post_id, locale, slug, title, summary, body_mdx, cover_image, hero_video, author, status, published_at',
      )
      .eq('locale', locale)
      .eq('slug', slug)
      .maybeSingle();

    if (localizationFetchError || !localizationRow) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`,
      };
    }

    const { data: postRow } = await client.from('posts').select('id, kind').eq('id', localizationRow.post_id).single();

    if (!postRow || postRow.kind !== type) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`,
      };
    }

    const currentLocale = toSupportedLocale(locale);
    const desiredSlug = data.title ? generateSlug(data.title) : localizationRow.slug;
    const nextSlug =
      data.title && currentLocale
        ? await resolveAvailableSlug(client, currentLocale, desiredSlug, localizationRow.id)
        : desiredSlug;

    const nextPublished =
      data.published !== undefined
        ? getPublishedState(data.published)
        : {
            status: localizationRow.status,
            published_at: localizationRow.published_at,
          };

    const existingTags = await readTagsForLocalization(client, localizationRow.id);
    const updatePayload = {
      slug: nextSlug,
      title: data.title ?? localizationRow.title,
      summary: data.summary ?? localizationRow.summary,
      body_mdx: data.content ?? localizationRow.body_mdx,
      cover_image:
        data.coverImage !== undefined ? data.coverImage || null : localizationRow.cover_image,
      hero_video:
        data.heroVideo !== undefined ? data.heroVideo || null : localizationRow.hero_video,
      author: data.author ?? localizationRow.author,
      status: nextPublished.status,
      published_at: nextPublished.published_at,
    };

    const { error: updateError } = await client
      .from('post_localizations')
      .update(updatePayload)
      .eq('id', localizationRow.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const nextTags = data.tags ? normalizeTags(data.tags) : existingTags;
    if (data.tags) {
      await syncTags(localizationRow.id, data.tags);
    }

    await createRevision(localizationRow.id, {
      title: updatePayload.title,
      summary: updatePayload.summary,
      bodyMdx: updatePayload.body_mdx,
      coverImage: updatePayload.cover_image || undefined,
      heroVideo: updatePayload.hero_video || undefined,
      author: updatePayload.author,
      tags: nextTags,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deletePost(
  locale: string,
  type: 'news' | 'blog',
  slug: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = ensureClient();

    const { data: localizationRow, error: localizationError } = await client
      .from('post_localizations')
      .select('id, post_id')
      .eq('locale', locale)
      .eq('slug', slug)
      .maybeSingle();

    if (localizationError || !localizationRow) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`,
      };
    }

    const { data: postRow } = await client.from('posts').select('id, kind').eq('id', localizationRow.post_id).single();

    if (!postRow || postRow.kind !== type) {
      return {
        success: false,
        error: `Post with slug "${slug}" not found in ${locale}/${type}`,
      };
    }

    const { error: deleteError } = await client.from('post_localizations').delete().eq('id', localizationRow.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const { count } = await client
      .from('post_localizations')
      .select('id', { head: true, count: 'exact' })
      .eq('post_id', localizationRow.post_id);

    if ((count || 0) === 0) {
      await client.from('posts').delete().eq('id', localizationRow.post_id);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function listPosts(locale?: string, type?: 'news' | 'blog'): Promise<PostFile[]> {
  try {
    const client = ensureClient();

    let localizationQuery = client
      .from('post_localizations')
      .select(
        'id, post_id, locale, slug, title, summary, body_mdx, cover_image, hero_video, author, status, published_at, created_at, updated_at',
      )
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (locale) {
      localizationQuery = localizationQuery.eq('locale', locale);
    }

    const { data: localizations, error: localizationsError } = await localizationQuery;
    if (localizationsError || !localizations) {
      throw new Error(localizationsError?.message || 'Failed to list localizations');
    }

    if (localizations.length === 0) {
      return [];
    }

    const postIds = [...new Set(localizations.map((row) => row.post_id))];
    const { data: posts, error: postsError } = await client
      .from('posts')
      .select('id, kind, translation_group_key')
      .in('id', postIds);

    if (postsError || !posts) {
      throw new Error(postsError?.message || 'Failed to list posts');
    }

    const postMap = new Map(posts.map((row) => [row.id, row]));

    const localizationIds = localizations.map((row) => row.id);
    const { data: tagRows } = await client
      .from('post_localization_tags')
      .select('post_localization_id, tags(name)')
      .in('post_localization_id', localizationIds);

    const tagMap = new Map<string, string[]>();
    for (const row of tagRows || []) {
      const current = tagMap.get(row.post_localization_id) || [];
      const name = extractTagName(row.tags as { name?: string } | { name?: string }[] | null);
      if (name) {
        current.push(name);
        tagMap.set(row.post_localization_id, current);
      }
    }

    const mapped: PostFile[] = [];
    for (const row of localizations) {
      const post = postMap.get(row.post_id);
      if (!post) {
        continue;
      }

      const rowType = post.kind === 'news' ? 'news' : 'blog';
      if (type && rowType !== type) {
        continue;
      }

      mapped.push({
        id: row.id,
        postId: row.post_id,
        slug: row.slug,
        filePath: `${row.locale}/${rowType}/${row.slug}`,
        data: {
          status:
            row.status === 'archived' || row.status === 'draft' || row.status === 'published'
              ? row.status
              : (row.status === 'published' ? 'published' : 'draft'),
          title: row.title,
          author: row.author,
          summary: row.summary,
          type: rowType,
          locale: row.locale,
          createdAt: row.created_at,
          publishedAt: row.published_at,
          date: row.published_at || row.created_at,
          updated: row.updated_at,
          coverImage: row.cover_image || undefined,
          heroVideo: row.hero_video || undefined,
          published: row.status === 'published',
          tags: tagMap.get(row.id) || [],
          content: row.body_mdx,
          translation_key: post.translation_group_key,
        },
      });
    }

    return mapped;
  } catch (error) {
    console.error('Error listing posts from DB:', error);
    return [];
  }
}
