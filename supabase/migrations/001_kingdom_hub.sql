begin;

create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_roles where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  player_id text not null unique check(player_id ~ '^\d{3,20}$'),
  player_name text not null check(length(player_name) between 1 and 80),
  alliance text not null check(alliance in ('404','401','FXF','BLO','OMG','GLX')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;
grant select on public.members to authenticated;
create policy members_read on public.members for select to authenticated using(id=(select auth.uid()) or (select public.is_admin()));

create or replace function public.register_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_user_meta_data->>'consent' is distinct from 'true' then raise exception 'Privacy consent is required'; end if;
  insert into public.members(id,player_id,player_name,alliance)
  values(new.id,new.raw_user_meta_data->>'player_id',trim(new.raw_user_meta_data->>'player_name'),new.raw_user_meta_data->>'alliance');
  return new;
end;
$$;
revoke all on function public.register_member() from public;
create trigger register_member after insert on auth.users for each row execute function public.register_member();

create table public.member_forms (
  user_id uuid not null references public.members(id) on delete cascade,
  kind text not null check(kind in ('profile','availability','prep')),
  cycle text not null check(cycle='current' or cycle ~ '^\d{4}-\d{2}-\d{2}$'),
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768),
  updated_at timestamptz not null default now(),
  primary key(user_id,kind,cycle),
  check(not(payload ?| array['power','total_power','troop_count','infantry','cavalry','archers','is_transfer'])),
  check((kind='profile' and cycle='current') or (kind='availability' and cycle=payload->>'event_date') or (kind='prep' and cycle=payload->>'battle_date'))
);
create index member_forms_latest on public.member_forms(kind,updated_at desc);
alter table public.member_forms enable row level security;
revoke all on public.member_forms from anon, authenticated;
grant select,insert,update,delete on public.member_forms to authenticated;
create policy forms_read on public.member_forms for select to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));
create policy forms_insert on public.member_forms for insert to authenticated with check(user_id=(select auth.uid()));
create policy forms_update on public.member_forms for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy forms_delete on public.member_forms for delete to authenticated using(user_id=(select auth.uid()) or (select public.is_admin()));

create or replace function public.sync_profile_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind='profile' then
    update public.members set player_name=trim(new.payload->>'player_name'),alliance=new.payload->>'alliance' where id=new.user_id;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_profile_identity() from public;
create trigger sync_profile_identity after insert or update on public.member_forms for each row execute function public.sync_profile_identity();

create table public.transfer_applications (
  id uuid primary key,
  player_name text not null, player_id text not null,
  current_kingdom integer not null,
  preferred_alliance text not null, preferred_times text not null,
  kvk_participation text not null, languages text not null,
  contact text not null, notes text not null default '',
  consent boolean not null check(consent),consent_at timestamptz not null,
  status text not null default 'new' check(status in ('new','reviewing','approved','declined')),
  admin_notes text not null default '',created_at timestamptz not null default now()
);
alter table public.transfer_applications enable row level security;
revoke all on public.transfer_applications from anon, authenticated;
grant select,update,delete on public.transfer_applications to authenticated;
create policy transfers_admin on public.transfer_applications for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create table public.events (
  id uuid primary key default gen_random_uuid(),title text not null,
  kind text not null check(kind in ('Bear Hunt','KvK','Alliance')),
  alliance text check(alliance in ('404','401','FXF','BLO','OMG','GLX')),
  starts_at timestamptz not null,ends_at timestamptz not null check(ends_at>starts_at),
  description text not null,published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
grant select on public.events to anon,authenticated;
grant insert,update,delete on public.events to authenticated;
create policy events_public on public.events for select to anon,authenticated using(published);
create policy events_admin on public.events for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create table public.gallery (
  id uuid primary key default gen_random_uuid(),title text not null,caption text not null,
  category text not null,storage_path text not null unique,
  taken_on date,published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.gallery enable row level security;
grant select on public.gallery to anon,authenticated;
grant insert,update,delete on public.gallery to authenticated;
create policy gallery_public on public.gallery for select to anon,authenticated using(published);
create policy gallery_admin on public.gallery for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('gallery','gallery',false,4000000,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy gallery_files_read on storage.objects for select to anon,authenticated
using(bucket_id='gallery' and exists(select 1 from public.gallery where storage_path=name and published));
create policy gallery_files_admin on storage.objects for all to authenticated
using(bucket_id='gallery' and (select public.is_admin())) with check(bucket_id='gallery' and (select public.is_admin()));

create table public.request_limits (
  subject text primary key,window_start timestamptz not null,requests integer not null
);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from anon, authenticated;
create or replace function public.consume_submission_limit(p_subject text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  delete from public.request_limits where window_start<now()-interval '1 day';
  insert into public.request_limits(subject,window_start,requests) values(p_subject,now(),1)
  on conflict(subject) do update set
    requests=case when request_limits.window_start<now()-interval '15 minutes' then 1 else request_limits.requests+1 end,
    window_start=case when request_limits.window_start<now()-interval '15 minutes' then now() else request_limits.window_start end
  returning requests into used;
  return used<=30;
end;
$$;
revoke all on function public.consume_submission_limit(text) from public,anon,authenticated;
grant execute on function public.consume_submission_limit(text) to service_role;

grant all on public.members,public.member_forms,public.transfer_applications,public.events,public.gallery,public.request_limits,public.admin_roles to service_role;

commit;
