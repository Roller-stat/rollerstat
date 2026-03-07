-- Rollerstat unified Postgres schema
-- Source of truth locales: en, es, fr, it, pt

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists app_users (
  id text primary key,
  email text not null unique,
  name text,
  image text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at
before update on app_users
for each row execute function set_updated_at();

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('news', 'blog')),
  translation_group_key text not null,
  created_by text references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, translation_group_key)
);

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
before update on posts
for each row execute function set_updated_at();

create table if not exists post_localizations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  locale text not null check (locale in ('en', 'es', 'fr', 'it', 'pt')),
  slug text not null,
  title text not null,
  summary text not null,
  body_mdx text not null,
  cover_image text,
  hero_video text,
  author text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, locale),
  unique (locale, slug)
);

create index if not exists idx_post_localizations_locale_status_published_at
  on post_localizations (locale, status, published_at desc nulls last);
create index if not exists idx_post_localizations_post_id
  on post_localizations (post_id);

drop trigger if exists trg_post_localizations_updated_at on post_localizations;
create trigger trg_post_localizations_updated_at
before update on post_localizations
for each row execute function set_updated_at();

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists post_localization_tags (
  post_localization_id uuid not null references post_localizations(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_localization_id, tag_id)
);

create index if not exists idx_post_localization_tags_tag_id
  on post_localization_tags (tag_id);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  post_localization_id uuid not null references post_localizations(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_post_id_status_created
  on comments (post_id, status, created_at desc);

create index if not exists idx_comments_post_localization_id
  on comments (post_localization_id);

drop trigger if exists trg_comments_updated_at on comments;
create trigger trg_comments_updated_at
before update on comments
for each row execute function set_updated_at();

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  post_localization_id uuid not null references post_localizations(id) on delete cascade,
  device_hash text not null,
  reaction_type text not null default 'like' check (reaction_type in ('like', 'applaud', 'love', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, device_hash)
);

create index if not exists idx_reactions_post_id_type
  on reactions (post_id, reaction_type);

create index if not exists idx_reactions_post_localization_id
  on reactions (post_localization_id);

drop trigger if exists trg_reactions_updated_at on reactions;
create trigger trg_reactions_updated_at
before update on reactions
for each row execute function set_updated_at();

create table if not exists post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_localization_id uuid not null references post_localizations(id) on delete cascade,
  editor_user_id text references app_users(id) on delete set null,
  title text not null,
  summary text not null,
  body_mdx text not null,
  cover_image text,
  hero_video text,
  author text not null,
  tags text[] not null default '{}',
  snapshot_at timestamptz not null default now()
);

create index if not exists idx_post_revisions_localization_snapshot
  on post_revisions (post_localization_id, snapshot_at desc);
