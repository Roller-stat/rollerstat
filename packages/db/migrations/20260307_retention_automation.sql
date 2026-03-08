-- Retention automation for comments, reactions, and contact submissions.
-- Policy targets:
-- - comments: keep until deleted; hard-delete deleted comments after 30 days
-- - reactions: retain up to 12 months
-- - contact submissions: retain up to 12 months

create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  locale text,
  source text not null default 'contact_form',
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_submissions_created_at
  on contact_submissions (created_at desc);

create index if not exists idx_contact_submissions_email_created
  on contact_submissions (email, created_at desc);

create table if not exists retention_job_runs (
  id bigint generated always as identity primary key,
  invoked_by text not null default 'manual',
  status text not null default 'success' check (status in ('success', 'error')),
  comments_deleted integer not null default 0,
  reactions_deleted integer not null default 0,
  contact_submissions_deleted integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_retention_job_runs_started_at
  on retention_job_runs (started_at desc);

create or replace function public.run_retention_cleanup(p_invoked_by text default 'manual')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started_at timestamptz := now();
  v_comments_deleted integer := 0;
  v_reactions_deleted integer := 0;
  v_contact_deleted integer := 0;
  v_run_id bigint;
begin
  delete from comments
  where status = 'deleted'
    and updated_at < (now() - interval '30 days');
  get diagnostics v_comments_deleted = row_count;

  delete from reactions
  where created_at < (now() - interval '12 months');
  get diagnostics v_reactions_deleted = row_count;

  delete from contact_submissions
  where created_at < (now() - interval '12 months');
  get diagnostics v_contact_deleted = row_count;

  insert into retention_job_runs (
    invoked_by,
    status,
    comments_deleted,
    reactions_deleted,
    contact_submissions_deleted,
    started_at,
    finished_at
  )
  values (
    coalesce(nullif(trim(p_invoked_by), ''), 'manual'),
    'success',
    v_comments_deleted,
    v_reactions_deleted,
    v_contact_deleted,
    v_started_at,
    now()
  )
  returning id into v_run_id;

  return jsonb_build_object(
    'success', true,
    'runId', v_run_id,
    'invokedBy', coalesce(nullif(trim(p_invoked_by), ''), 'manual'),
    'commentsDeleted', v_comments_deleted,
    'reactionsDeleted', v_reactions_deleted,
    'contactSubmissionsDeleted', v_contact_deleted,
    'retention', jsonb_build_object(
      'commentsDeletedAfterDays', 30,
      'reactionsMaxAgeMonths', 12,
      'contactSubmissionsMaxAgeMonths', 12
    ),
    'startedAt', v_started_at,
    'finishedAt', now()
  );
exception
  when others then
    insert into retention_job_runs (
      invoked_by,
      status,
      comments_deleted,
      reactions_deleted,
      contact_submissions_deleted,
      error_message,
      started_at,
      finished_at
    )
    values (
      coalesce(nullif(trim(p_invoked_by), ''), 'manual'),
      'error',
      v_comments_deleted,
      v_reactions_deleted,
      v_contact_deleted,
      sqlerrm,
      v_started_at,
      now()
    );

    raise;
end;
$$;

-- Attempt to register an automatic daily cleanup in pg_cron when available.
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception
    when others then
      raise notice 'pg_cron extension unavailable: %', sqlerrm;
  end;

  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    if not exists (
      select 1
      from cron.job
      where jobname = 'rollerstat_retention_cleanup_daily'
    ) then
      perform cron.schedule(
        'rollerstat_retention_cleanup_daily',
        '17 3 * * *',
        $job$select public.run_retention_cleanup('pg_cron_daily');$job$
      );
    end if;
  end if;
end
$$;
