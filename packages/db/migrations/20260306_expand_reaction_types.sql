-- Expand reaction type options for emoji reactions

alter table if exists reactions
  drop constraint if exists reactions_reaction_type_check;

update reactions
set reaction_type = 'applaud'
where reaction_type = 'celebrate';

alter table if exists reactions
  add constraint reactions_reaction_type_check
  check (reaction_type in ('like', 'applaud', 'love', 'dislike'));

alter table if exists reactions
  alter column reaction_type set default 'like';
