-- Make forms table compatible with the current app and allow public form usage.
-- This project already has public.forms (title/schema/is_active) and public.form_responses.
-- We add compatibility columns and public RLS policies needed for /f/:id (or /:company/:id).

-- 1) Compatibility columns (safe to re-run)
alter table public.forms add column if not exists name text;
alter table public.forms add column if not exists questions jsonb not null default '[]'::jsonb;
alter table public.forms add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.forms add column if not exists shareable_link text;

-- 2) Backfill best-effort from existing columns
update public.forms
set name = coalesce(name, title)
where name is null;

-- If `schema` contains questions/settings, copy them into the new columns.
update public.forms
set questions = case
  when jsonb_typeof(schema->'questions') = 'array' then schema->'questions'
  when jsonb_typeof(schema->'fields') = 'array' then schema->'fields'
  else questions
end
where questions = '[]'::jsonb;

update public.forms
set settings = case
  when jsonb_typeof(schema->'settings') = 'object' then schema->'settings'
  else settings
end
where settings = '{}'::jsonb;

-- 3) Ensure RLS is enabled
alter table public.forms enable row level security;
alter table public.form_responses enable row level security;

-- 4) Minimum grants (RLS still applies)
grant select on table public.forms to anon, authenticated;
grant insert on table public.form_responses to anon, authenticated;
grant select, insert, update, delete on table public.forms to authenticated;
grant select, update, delete on table public.form_responses to authenticated;

-- 5) Policies
-- Owners can manage their forms.
drop policy if exists forms_owner_select on public.forms;
create policy forms_owner_select
on public.forms
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists forms_owner_insert on public.forms;
create policy forms_owner_insert
on public.forms
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists forms_owner_update on public.forms;
create policy forms_owner_update
on public.forms
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists forms_owner_delete on public.forms;
create policy forms_owner_delete
on public.forms
for delete
to authenticated
using (user_id = auth.uid());

-- Public can read active forms.
drop policy if exists forms_public_select_active on public.forms;
create policy forms_public_select_active
on public.forms
for select
to anon, authenticated
using (is_active = true);

-- Owners can read their form responses.
drop policy if exists form_responses_owner_select on public.form_responses;
create policy form_responses_owner_select
on public.form_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.user_id = auth.uid()
  )
);

drop policy if exists form_responses_owner_update on public.form_responses;
create policy form_responses_owner_update
on public.form_responses
for update
to authenticated
using (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.user_id = auth.uid()
  )
);

drop policy if exists form_responses_owner_delete on public.form_responses;
create policy form_responses_owner_delete
on public.form_responses
for delete
to authenticated
using (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.user_id = auth.uid()
  )
);

-- Public can submit responses to active forms.
drop policy if exists form_responses_public_insert_active_form on public.form_responses;
create policy form_responses_public_insert_active_form
on public.form_responses
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.forms f
    where f.id = form_id
      and f.is_active = true
  )
);
