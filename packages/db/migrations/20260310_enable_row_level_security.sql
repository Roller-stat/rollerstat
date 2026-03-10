-- Enable RLS on application tables.
-- This blocks direct anon/authenticated access unless explicit policies are added.
-- Server-side calls using the service role key continue to work.

alter table if exists app_users enable row level security;
alter table if exists posts enable row level security;
alter table if exists post_localizations enable row level security;
alter table if exists tags enable row level security;
alter table if exists post_localization_tags enable row level security;
alter table if exists comments enable row level security;
alter table if exists reactions enable row level security;
alter table if exists post_revisions enable row level security;
alter table if exists contact_submissions enable row level security;
alter table if exists retention_job_runs enable row level security;
