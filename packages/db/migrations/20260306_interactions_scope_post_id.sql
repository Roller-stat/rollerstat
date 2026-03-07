-- Share comments/reactions across locales by canonical post_id
-- Keeps post_localization_id for traceability while switching interaction scope.

alter table if exists comments
  add column if not exists post_id uuid;

alter table if exists reactions
  add column if not exists post_id uuid;

update comments c
set post_id = pl.post_id
from post_localizations pl
where c.post_localization_id = pl.id
  and c.post_id is null;

update reactions r
set post_id = pl.post_id
from post_localizations pl
where r.post_localization_id = pl.id
  and r.post_id is null;

-- Remove duplicate reactions that collide under the new canonical key.
with ranked as (
  select
    id,
    row_number() over (
      partition by post_id, device_hash
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from reactions
  where post_id is not null
)
delete from reactions r
using ranked d
where r.id = d.id
  and d.rn > 1;

alter table if exists comments
  alter column post_id set not null;

alter table if exists reactions
  alter column post_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'comments_post_id_fkey'
  ) then
    alter table comments
      add constraint comments_post_id_fkey
      foreign key (post_id) references posts(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reactions_post_id_fkey'
  ) then
    alter table reactions
      add constraint reactions_post_id_fkey
      foreign key (post_id) references posts(id) on delete cascade;
  end if;
end $$;

drop index if exists idx_comments_post_status_created;
create index if not exists idx_comments_post_id_status_created
  on comments (post_id, status, created_at desc);

create index if not exists idx_comments_post_localization_id
  on comments (post_localization_id);

drop index if exists idx_reactions_post_type;
create index if not exists idx_reactions_post_id_type
  on reactions (post_id, reaction_type);

create index if not exists idx_reactions_post_localization_id
  on reactions (post_localization_id);

alter table if exists reactions
  drop constraint if exists reactions_post_localization_id_device_hash_key;

alter table if exists reactions
  add constraint reactions_post_id_device_hash_key unique (post_id, device_hash);
