import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const CONTENT_ROOT = path.resolve(process.cwd(), 'packages/content/posts');
const VALID_LOCALES = new Set(['en', 'es', 'fr', 'it', 'pt']);
const VALID_KINDS = new Set(['news', 'blog']);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or Supabase key env var for import.');
  }

  return { url, key };
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const [, frontmatter, body] = match;
  const data = {};

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

  return {
    data,
    body: body.trim(),
  };
}

async function walkMdxFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMdxFiles(abs)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(abs);
    }
  }

  return out;
}

function toStatus(frontmatterPublished) {
  return frontmatterPublished === false ? 'draft' : 'published';
}

function normalizeKind(contentType, folderName) {
  const fromFrontmatter = contentType === 'news' ? 'news' : contentType === 'blog' ? 'blog' : null;
  if (fromFrontmatter) return fromFrontmatter;
  return folderName === 'news' ? 'news' : 'blog';
}

async function main() {
  const { url, key } = getSupabaseConfig();
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const files = await walkMdxFiles(CONTENT_ROOT);
  if (files.length === 0) {
    console.log('No MDX files found to import.');
    return;
  }

  let imported = 0;

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = parseFrontmatter(raw);

    if (!parsed) {
      console.warn(`Skipping invalid frontmatter file: ${filePath}`);
      continue;
    }

    const { data, body } = parsed;
    const locale = String(data.locale || '').trim();
    if (!VALID_LOCALES.has(locale)) {
      console.warn(`Skipping file with unsupported locale (${locale}): ${filePath}`);
      continue;
    }

    const folderKind = path.basename(path.dirname(filePath)) === 'news' ? 'news' : 'blog';
    const kind = normalizeKind(data.contentType, folderKind);
    if (!VALID_KINDS.has(kind)) {
      console.warn(`Skipping file with unsupported kind (${kind}): ${filePath}`);
      continue;
    }

    const slug = String(data.slug || path.basename(filePath, '.mdx')).trim();
    const groupKey = String(data.translation_key || slug).trim();
    const status = toStatus(data.published);
    const publishedAt = status === 'published' && data.date ? new Date(String(data.date)).toISOString() : null;

    const postPayload = {
      kind,
      translation_group_key: groupKey,
    };

    const { data: postRow, error: postError } = await supabase
      .from('posts')
      .upsert(postPayload, { onConflict: 'kind,translation_group_key' })
      .select('id')
      .single();

    if (postError || !postRow) {
      throw new Error(`Failed upserting posts for ${filePath}: ${postError?.message || 'unknown error'}`);
    }

    const localizationPayload = {
      post_id: postRow.id,
      locale,
      slug,
      title: String(data.title || slug),
      summary: String(data.summary || ''),
      body_mdx: body,
      cover_image: data.coverImage ? String(data.coverImage) : null,
      hero_video: data.heroVideo ? String(data.heroVideo) : null,
      author: String(data.author || 'Unknown'),
      status,
      published_at: publishedAt,
    };

    const { data: locRow, error: locError } = await supabase
      .from('post_localizations')
      .upsert(localizationPayload, { onConflict: 'locale,slug' })
      .select('id')
      .single();

    if (locError || !locRow) {
      throw new Error(`Failed upserting localization for ${filePath}: ${locError?.message || 'unknown error'}`);
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
      : [];

    const { error: clearError } = await supabase
      .from('post_localization_tags')
      .delete()
      .eq('post_localization_id', locRow.id);

    if (clearError) {
      throw new Error(`Failed clearing tags for ${filePath}: ${clearError.message}`);
    }

    for (const tagName of tags) {
      const { data: tagRow, error: tagError } = await supabase
        .from('tags')
        .upsert({ name: tagName }, { onConflict: 'name' })
        .select('id')
        .single();

      if (tagError || !tagRow) {
        throw new Error(`Failed upserting tag (${tagName}) for ${filePath}: ${tagError?.message || 'unknown error'}`);
      }

      const { error: joinError } = await supabase
        .from('post_localization_tags')
        .upsert({
          post_localization_id: locRow.id,
          tag_id: tagRow.id,
        }, {
          onConflict: 'post_localization_id,tag_id',
        });

      if (joinError) {
        throw new Error(`Failed linking tag (${tagName}) for ${filePath}: ${joinError.message}`);
      }
    }

    imported += 1;
  }

  console.log(`Imported ${imported} content files into Postgres.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
