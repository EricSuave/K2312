-- Admin-entered prep records for players with or without website accounts.
-- Preserves existing accounts and forms. Safe to rerun.
begin;

create table if not exists public.managed_members (
  player_id text primary key check(player_id ~ '^\d{3,20}$'),
  player_name text not null check(length(trim(player_name)) between 1 and 80),
  alliance text check(alliance in ('404','401','FXF','BLO','OMG','GLX')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.managed_prep_forms (
  player_id text not null references public.managed_members(player_id) on delete cascade,
  cycle text not null check(cycle ~ '^\d{4}-\d{2}-\d{2}$'),
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=32768),
  revision uuid not null default gen_random_uuid(),
  entered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(player_id,cycle),
  check(payload ? 'battle_date' and cycle=payload->>'battle_date'),
  check(not(payload ?| array['power','total_power','troop_count','is_transfer','gear','charms']))
);
create index if not exists managed_prep_latest on public.managed_prep_forms(updated_at desc);
alter table public.managed_members enable row level security;
alter table public.managed_prep_forms enable row level security;
revoke all on public.managed_members,public.managed_prep_forms from public,anon,authenticated;
grant select on public.managed_members,public.managed_prep_forms to authenticated;
grant all on public.managed_members,public.managed_prep_forms to service_role;
drop policy if exists managed_members_admin_read on public.managed_members;
create policy managed_members_admin_read on public.managed_members for select to authenticated using((select public.is_admin()));
drop policy if exists managed_prep_admin_read on public.managed_prep_forms;
create policy managed_prep_admin_read on public.managed_prep_forms for select to authenticated using((select public.is_admin()));

-- Latest submission wins for the same real player ID and KvK battle date.
-- SECURITY INVOKER keeps all underlying row-level access checks in force.
create or replace view public.admin_prep_entries with (security_invoker=true) as
select distinct on (player_id,cycle)
  'player:'||player_id as user_id,player_id,player_name,alliance,
  'prep'::text as kind,cycle,payload,updated_at,entry_source,entered_by
from (
  select m.player_id,m.player_name,m.alliance,f.cycle,f.payload,f.updated_at,
    'member'::text as entry_source,f.user_id as entered_by
  from public.member_forms f join public.members m on m.id=f.user_id
  where f.kind='prep' and (select public.is_admin())
  union all
  select m.player_id,m.player_name,m.alliance,f.cycle,f.payload,f.updated_at,
    'admin'::text as entry_source,f.entered_by
  from public.managed_prep_forms f join public.managed_members m using(player_id)
  where (select public.is_admin())
) entries
order by player_id,cycle,updated_at desc,entry_source asc;
revoke all on public.admin_prep_entries from public,anon;
grant select on public.admin_prep_entries to authenticated,service_role;

-- Read the effective form and edit tokens in one SQL snapshot.
create or replace function public.load_admin_prep(p_player_id text,p_cycle text)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  return (
    select jsonb_build_object(
      'player_id',p_player_id,'cycle',p_cycle,
      'player_name',coalesce(e.player_name,g.player_name,m.player_name,''),
      'alliance',case when e.player_id is not null then e.alliance when g.player_id is not null then g.alliance else m.alliance end,
      'has_account',m.id is not null,'exists',g.player_id is not null or m.id is not null,
      'payload',e.payload,'entry_source',e.entry_source,'updated_at',e.updated_at,
      'expected_revision',f.revision,'expected_self_updated_at',own.updated_at,'expected_member_updated_at',g.updated_at
    ) from (select p_player_id as player_id) input
    left join public.members m on m.player_id=input.player_id
    left join public.managed_members g on g.player_id=input.player_id
    left join public.managed_prep_forms f on f.player_id=input.player_id and f.cycle=p_cycle
    left join public.member_forms own on own.user_id=m.id and own.kind='prep' and own.cycle=p_cycle
    left join public.admin_prep_entries e on e.player_id=input.player_id and e.cycle=p_cycle
  );
end;
$$;
revoke all on function public.load_admin_prep(text,text) from public,anon;
grant execute on function public.load_admin_prep(text,text) to authenticated;

-- Only an authenticated admin can write; attribution comes from the session.
-- The revision checks prevent two administrators silently replacing each other's work.
create or replace function public.save_admin_prep(
  p_player_id text,p_player_name text,p_alliance text,p_payload jsonb,
  p_expected_revision uuid default null,p_expected_self_updated_at timestamptz default null,
  p_expected_member_updated_at timestamptz default null
) returns table(revision uuid,updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid := auth.uid();
  v_cycle text := p_payload->>'battle_date';
  v_revision uuid; v_self_updated_at timestamptz; v_member_updated_at timestamptz;
  v_new_revision uuid := gen_random_uuid(); v_now timestamptz := clock_timestamp();
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  if p_player_id is null or p_player_id !~ '^\d{3,20}$'
    or p_player_name is null or length(trim(p_player_name)) not between 1 and 80
    or (p_alliance is not null and p_alliance not in ('404','401','FXF','BLO','OMG','GLX'))
    or p_payload is null or jsonb_typeof(p_payload)<>'object'
    or v_cycle is null or v_cycle !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'Invalid member or preparation values' using errcode='22023';
  end if;
  -- Lock all edits for this player, including different cycles and first-time inserts.
  perform pg_advisory_xact_lock(hashtextextended('managed-prep:'||p_player_id,0));
  select m.updated_at into v_member_updated_at from public.managed_members m where m.player_id=p_player_id;
  select f.revision into v_revision from public.managed_prep_forms f where f.player_id=p_player_id and f.cycle=v_cycle;
  select f.updated_at into v_self_updated_at from public.member_forms f
    join public.members m on m.id=f.user_id where m.player_id=p_player_id and f.kind='prep' and f.cycle=v_cycle;
  if v_revision is distinct from p_expected_revision
    or v_self_updated_at is distinct from p_expected_self_updated_at
    or v_member_updated_at is distinct from p_expected_member_updated_at then
    raise exception 'PREP_EDIT_CONFLICT' using errcode='P0001';
  end if;
  insert into public.managed_members(player_id,player_name,alliance,created_by,updated_by,created_at,updated_at)
    values(p_player_id,trim(p_player_name),p_alliance,v_actor,v_actor,v_now,v_now)
    on conflict(player_id) do update set player_name=excluded.player_name,alliance=excluded.alliance,updated_by=v_actor,updated_at=v_now;
  insert into public.managed_prep_forms(player_id,cycle,payload,revision,entered_by,created_at,updated_at)
    values(p_player_id,v_cycle,p_payload,v_new_revision,v_actor,v_now,v_now)
    on conflict(player_id,cycle) do update set payload=excluded.payload,revision=v_new_revision,entered_by=v_actor,updated_at=v_now;
  return query select v_new_revision,v_now;
end;
$$;
revoke all on function public.save_admin_prep(text,text,text,jsonb,uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.save_admin_prep(text,text,text,jsonb,uuid,timestamptz,timestamptz) to authenticated;

notify pgrst,'reload schema';
commit;
