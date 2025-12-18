-- Public organization name (user-editable) with unique slug.
-- Used for human-friendly public form URLs: /:orgSlug/:formId

-- 1) Columns
alter table public.organizations add column if not exists public_name text;
alter table public.organizations add column if not exists public_slug text;

-- 2) Slugify helper (SQL)
create or replace function public.scutch_slugify(p_value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(lower(trim(coalesce(p_value, ''))), '[^a-z0-9]+', '-', 'g'),
      '(^-+)|(-+$)',
      '',
      'g'
    ),
    '-{2,}',
    '-',
    'g'
  );
$$;

-- 3) Backfill existing rows
update public.organizations
set public_name = coalesce(public_name, name)
where public_name is null;

update public.organizations
set public_slug = nullif(public.scutch_slugify(public_name), '')
where public_slug is null;

-- 4) Uniqueness (case-insensitive)
create unique index if not exists organizations_public_slug_unique
  on public.organizations ((lower(public_slug)))
  where public_slug is not null;

-- 5) RLS policy for updates (personal org == auth.uid())
drop policy if exists organizations_update_personal on public.organizations;
create policy organizations_update_personal
on public.organizations
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 6) Grants (RLS still applies)
grant update on table public.organizations to authenticated;
grant select on table public.organizations to authenticated;
